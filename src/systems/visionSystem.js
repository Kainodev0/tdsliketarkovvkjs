// src/systems/visionSystem.js
// Improved vision system with Darkwood-style effect

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
        // Проверяем только стены без вращения для упрощения
        if (!wall.rotation && 
            x > wall.x && x < wall.x + wall.w && 
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
 * @param {number} coneAngle - Угол конуса видимости в радианах (по умолчанию 2.0 ≈ 115 градусов)
 * @returns {Object} - Объект с точками для конуса видимости
 */
export function getVisibleTiles(player, customMap, viewDistance = 500, coneAngle = 2.0) {
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
  const rayCount = 40; // Увеличиваем количество лучей для более гладкого конуса
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
  const nearSightRadius = 40; // Увеличен для лучшей видимости вблизи игрока
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
  if (angleDiff <= visibilityData.coneAngle / 2) {
    // Проверяем, нет ли стены между игроком и точкой
    // Для этого бросаем луч от игрока к точке
    const rayToPoint = castRay(
      visibilityData.coneTip.x,
      visibilityData.coneTip.y,
      angle,
      distance,
      map
    );
    
    // Если луч пересекся со стеной до достижения точки,
    // то точка не видима
    const distToHit = Math.sqrt(
      Math.pow(rayToPoint.x - visibilityData.coneTip.x, 2) +
      Math.pow(rayToPoint.y - visibilityData.coneTip.y, 2)
    );
    
    return distToHit >= distance - 2; // Небольшой запас для погрешности
  }
  
  return false;
}

/**
 * Применяет эффект видимости в стиле Darkwood к сцене
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {Object} visibilityData - Данные о видимости
 */
export function applyVisionEffect(ctx, visibilityData) {
  // Без данных о видимости ничего не делаем
  if (!visibilityData || !visibilityData.points || visibilityData.points.length < 3) {
    return;
  }
  
  const { width, height } = ctx.canvas;
  
  // 1. Сохраняем текущую сцену (цветную)
  const originalScene = ctx.getImageData(0, 0, width, height);
  
  // 2. Создаем серую версию сцены
  const grayscaleScene = ctx.getImageData(0, 0, width, height);
  const grayscaleData = grayscaleScene.data;
  
  // Преобразуем все пиксели в grayscale
  for (let i = 0; i < grayscaleData.length; i += 4) {
    const r = grayscaleData[i];
    const g = grayscaleData[i + 1];
    const b = grayscaleData[i + 2];
    
    // Формула для преобразования в оттенки серого
    const gray = 0.3 * r + 0.59 * g + 0.11 * b;
    
    // Затемняем серую область для лучшего контраста
    const darkGray = gray * 0.3;
    
    grayscaleData[i] = darkGray;     // R
    grayscaleData[i + 1] = darkGray; // G
    grayscaleData[i + 2] = darkGray; // B
    // Не меняем alpha канал
  }
  
  // 3. Рисуем ч/б версию сцены
  ctx.putImageData(grayscaleScene, 0, 0);
  
  // 4. Создаем маску для области видимости
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = width;
  maskCanvas.height = height;
  const maskCtx = maskCanvas.getContext('2d');
  
  // Черный фон для маски
  maskCtx.fillStyle = 'black';
  maskCtx.fillRect(0, 0, width, height);
  
  // Рисуем белый конус видимости на маске
  maskCtx.fillStyle = 'white';
  
  // Конус видимости
  maskCtx.beginPath();
  maskCtx.moveTo(visibilityData.coneTip.x, visibilityData.coneTip.y);
  
  for (let i = 1; i < visibilityData.points.length; i++) {
    maskCtx.lineTo(visibilityData.points[i].x, visibilityData.points[i].y);
  }
  
  maskCtx.closePath();
  maskCtx.fill();
  
  // Добавляем круговую область вокруг игрока
  maskCtx.beginPath();
  maskCtx.arc(visibilityData.coneTip.x, visibilityData.coneTip.y, 40, 0, Math.PI * 2);
  maskCtx.fill();
  
  // 5. Рисуем цветную сцену через маску только в области видимости
  ctx.save();
  
  // Используем маску как источник непрозрачности
  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(maskCanvas, 0, 0);
  
  ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(ctx.canvas, 0, 0);  // Сохраняем предыдущий рендер
  
  // Возвращаем цветные области
  ctx.globalCompositeOperation = 'source-atop';
  ctx.putImageData(originalScene, 0, 0);
  
  ctx.restore();
}

// Сброс кэша видимости
export function invalidateVisionCache() {
  visionCache = null;
}