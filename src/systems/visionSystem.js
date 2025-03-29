// Кэш видимых точек и координаты последнего положения игрока
let visionCache = null;
let lastPlayerX = null;
let lastPlayerY = null;
let lastPlayerAngle = null;

// Импортируем map напрямую
import { map } from '../engine/map.js';
import { debug } from '../engine/debugger.js';

/**
 * Проверяет пересечение луча со стеной и возвращает точку пересечения
 * @param {number} startX - Начальная X координата
 * @param {number} startY - Начальная Y координата
 * @param {number} angle - Угол луча в радианах
 * @param {number} maxDistance - Максимальная дистанция луча
 * @param {Object} currentMap - Карта с препятствиями
 * @returns {Object} - Точка пересечения или конечная точка луча
 */
function castRay(startX, startY, angle, maxDistance, currentMap) {
  // Шаг луча (меньший шаг даёт более точное попадание)
  const step = 5;
  
  // Направление луча
  const rayDirX = Math.cos(angle);
  const rayDirY = Math.sin(angle);
  
  // Текущая позиция луча
  let x = startX;
  let y = startY;
  let distance = 0;
  
  // Идём вдоль луча до препятствия или максимальной дистанции
  while (distance < maxDistance) {
    // Проверяем пересечение со стенами
    if (currentMap && currentMap.walls) {
      for (const wall of currentMap.walls) {
        if (x > wall.x && x < wall.x + wall.w && 
            y > wall.y && y < wall.y + wall.h) {
          // Луч пересёкся со стеной, возвращаем точку пересечения
          return { 
            x, 
            y, 
            distance,
            hit: true 
          };
        }
      }
    }
    
    // Увеличиваем дистанцию и продолжаем луч
    distance += step;
    x += rayDirX * step;
    y += rayDirY * step;
  }
  
  // Достигли максимальной дистанции без пересечений
  return { 
    x, 
    y, 
    distance: maxDistance,
    hit: false 
  };
}

/**
 * Создаёт массив точек для построения конуса видимости
 * @param {Object} player - Объект игрока
 * @param {Object} customMap - Карта (опционально)
 * @param {number} viewDistance - Максимальная дистанция видимости
 * @param {number} coneAngle - Угол конуса видимости в радианах (по умолчанию 1.4 ≈ 80 градусов)
 * @returns {Object} - Объект с точками для конуса видимости
 */
export function getVisibleTiles(player, customMap, viewDistance = 400, coneAngle = 1.4) {
  // Используем переданную карту или дефолтную
  const currentMap = customMap || map;
  
  // Проверяем на изменения положения игрока
  if (visionCache && 
      player.x === lastPlayerX && 
      player.y === lastPlayerY && 
      player.angle === lastPlayerAngle) {
    return visionCache;
  }
  
  const startTime = performance.now();
  
  // Создаём конус видимости
  const rayCount = 32; // Увеличиваем количество лучей для более гладкого конуса
  const halfCone = coneAngle / 2;
  
  // Начальная позиция игрока
  const startX = player.x;
  const startY = player.y;
  const playerAngle = player.angle;
  
  // Массив точек для конуса
  const rayPoints = [];
  
  // Добавляем начальную точку (позицию игрока)
  rayPoints.push({ x: startX, y: startY });
  
  // Бросаем лучи вперёд в конусе видимости
  for (let i = 0; i <= rayCount; i++) {
    // Угол текущего луча (от -halfCone до +halfCone относительно направления игрока)
    const rayAngle = playerAngle - halfCone + (coneAngle * i / rayCount);
    
    // Бросаем луч и получаем точку пересечения
    const hitPoint = castRay(startX, startY, rayAngle, viewDistance, currentMap);
    rayPoints.push({ x: hitPoint.x, y: hitPoint.y });
  }
  
  // Создаём структуру данных для видимости
  const visibilityData = {
    coneTip: { x: startX, y: startY },
    points: rayPoints,
    angle: playerAngle,
    coneAngle: coneAngle,
    viewDistance: viewDistance
  };
  
  // Сохраняем кэш и положение игрока
  visionCache = visibilityData;
  lastPlayerX = player.x;
  lastPlayerY = player.y;
  lastPlayerAngle = player.angle;
  
  const endTime = performance.now();
  // Логируем время выполнения для отладки производительности
  if (endTime - startTime > 10) { // Порог уменьшен для более частого отлова
    debug(`Расчёт видимости занял ${(endTime - startTime).toFixed(2)}ms`, 'warn');
  }
  
  return visibilityData;
}

/**
 * Проверяет, находится ли точка внутри конуса видимости
 * @param {Object} point - Точка для проверки {x, y}
 * @param {Object} visibilityData - Данные о видимости
 * @returns {boolean} - True, если точка видима
 */
export function isPointVisible(point, visibilityData) {
  if (!visibilityData || !visibilityData.points || visibilityData.points.length < 3) {
    return false;
  }
  
  // Проверяем расстояние от точки до игрока
  const dx = point.x - visibilityData.coneTip.x;
  const dy = point.y - visibilityData.coneTip.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Если точка слишком далеко - она не видима
  if (distance > visibilityData.viewDistance) {
    return false;
  }
  
  // Если точка очень близко к игроку - она всегда видима
  const nearSightRadius = 20;
  if (distance < nearSightRadius) {
    return true;
  }
  
  // Вычисляем угол между игроком и точкой
  const angle = Math.atan2(dy, dx);
  
  // Нормализуем угол игрока и точки, чтобы они были в одном диапазоне
  const normalizeAngle = (a) => {
    while (a < -Math.PI) a += 2 * Math.PI;
    while (a > Math.PI) a -= 2 * Math.PI;
    return a;
  };
  
  const normalizedPlayerAngle = normalizeAngle(visibilityData.angle);
  const normalizedPointAngle = normalizeAngle(angle);
  
  // Вычисляем разницу углов
  let angleDiff = Math.abs(normalizedPlayerAngle - normalizedPointAngle);
  if (angleDiff > Math.PI) {
    angleDiff = 2 * Math.PI - angleDiff;
  }
  
  // Проверяем, находится ли точка в конусе видимости
  return angleDiff <= visibilityData.coneAngle / 2;
}

/**
 * Создаёт маску видимости для области видимости игрока
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {Object} visibilityData - Данные о видимости
 */
export function createVisionMask(ctx, visibilityData) {
  if (!visibilityData || !visibilityData.points || visibilityData.points.length < 3) {
    return;
  }
  
  // Очищаем всё существующее в контексте
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
  // Создаём путь для конуса видимости
  ctx.beginPath();
  ctx.moveTo(visibilityData.coneTip.x, visibilityData.coneTip.y);
  
  // Добавляем все точки конуса
  for (let i = 1; i < visibilityData.points.length; i++) {
    ctx.lineTo(visibilityData.points[i].x, visibilityData.points[i].y);
  }
  
  // Замыкаем контур
  ctx.closePath();
  
  // Заливаем весь конус белым цветом (для создания маски)
  ctx.fillStyle = '#fff';
  ctx.fill();
  
  // Добавляем небольшую круговую область вокруг игрока
  ctx.beginPath();
  ctx.arc(visibilityData.coneTip.x, visibilityData.coneTip.y, 20, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Отрисовка сцены с применением системы видимости в стиле Darkwood
 * Эта функция вызывается из draw.js и заменяет предыдущие функции drawFog
 * @param {CanvasRenderingContext2D} ctx - Основной контекст рисования
 * @param {Object} visibilityData - Данные о видимости
 */
export function applyVisionEffect(ctx, visibilityData) {
  // Общий размер канваса
  const { width, height } = ctx.canvas;
  
  // Создаём временный канвас для хранения маски видимости
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = width;
  maskCanvas.height = height;
  const maskCtx = maskCanvas.getContext('2d');
  
  // Создаём маску видимости
  createVisionMask(maskCtx, visibilityData);
  
  // Затемняем всю область за пределами конуса видимости
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.drawImage(maskCanvas, 0, 0);
  ctx.restore();
  
  // Область за пределами конуса видимости становится черно-белой и темной
  ctx.save();
  
  // Рисуем полупрозрачный чёрный слой поверх всего экрана
  ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
  ctx.fillRect(0, 0, width, height);
  
  // Вырезаем область видимости из темного слоя
  ctx.globalCompositeOperation = 'destination-out';
  ctx.drawImage(maskCanvas, 0, 0);
  
  ctx.restore();
}

// Сброс кэша видимости
export function invalidateVisionCache() {
  visionCache = null;
}