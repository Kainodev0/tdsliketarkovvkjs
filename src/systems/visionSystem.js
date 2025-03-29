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
 * @param {number} coneAngle - Угол конуса видимости в радианах (по умолчанию 1.6 ≈ 90 градусов)
 * @returns {Object} - Объект с точками для конуса видимости
 */
export function getVisibleTiles(player, customMap, viewDistance = 350, coneAngle = 1.6) {
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
 * Отрисовка "тумана войны" с использованием конуса видимости
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {Object} visibilityData - Данные о видимости
 */
export function drawFog(ctx, visibilityData) {
  if (!visibilityData || !visibilityData.points || visibilityData.points.length < 3) {
    return;
  }
  
  // Сохраняем состояние контекста
  ctx.save();
  
  // Заливаем весь экран тёмным цветом
  ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
  // Режим наложения: вырезаем видимую область из темноты
  ctx.globalCompositeOperation = 'destination-out';
  
  // Рисуем конус видимости
  ctx.beginPath();
  
  // Начинаем с первой точки (игрока)
  ctx.moveTo(visibilityData.coneTip.x, visibilityData.coneTip.y);
  
  // Добавляем все остальные точки
  for (let i = 1; i < visibilityData.points.length; i++) {
    const point = visibilityData.points[i];
    ctx.lineTo(point.x, point.y);
  }
  
  // Замыкаем контур (возвращаемся к игроку)
  ctx.closePath();
  
  // Заливаем и/или обводим конус
  ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
  ctx.fill();
  
  // Для безопасности, добавляем небольшую область ближнего видения вокруг игрока
  // Просто небольшой круг, чтобы игрок всегда мог видеть область рядом с собой
  const nearSightRadius = 20; // Радиус ближнего видения
  ctx.beginPath();
  ctx.arc(visibilityData.coneTip.x, visibilityData.coneTip.y, nearSightRadius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fill();
  
  // Восстанавливаем состояние контекста
  ctx.restore();
}

// Сброс кэша видимости
export function invalidateVisionCache() {
  visionCache = null;
}