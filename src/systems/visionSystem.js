// Кэш видимых точек и координаты последнего положения игрока
let visionCache = null;
let lastPlayerX = null;
let lastPlayerY = null;
let lastPlayerAngle = null;

// Импортируем map напрямую
import { map } from '../engine/map.js';
import { debug } from '../engine/debugger.js';

/**
 * Создаёт луч и проверяет его пересечение со стенами
 * @param {number} startX - Начальная X координата
 * @param {number} startY - Начальная Y координата
 * @param {number} angle - Угол луча в радианах
 * @param {number} maxDistance - Максимальная дистанция луча
 * @param {Object} currentMap - Карта с препятствиями
 * @returns {Array} - Массив видимых точек вдоль луча
 */
function castRay(startX, startY, angle, maxDistance, currentMap) {
  const points = [];
  const step = 10; // Увеличиваем шаг для меньшего количества проверок
  
  let x = startX;
  let y = startY;
  
  for (let distance = 0; distance < maxDistance; distance += step) {
    x += Math.cos(angle) * step;
    y += Math.sin(angle) * step;
    
    // Добавляем точку в массив видимых
    points.push({ x, y });
    
    // Проверяем пересечение со стенами
    if (currentMap && currentMap.walls) {
      for (const wall of currentMap.walls) {
        if (x > wall.x && x < wall.x + wall.w && 
            y > wall.y && y < wall.y + wall.h) {
          // Луч пересёкся со стеной, выходим
          return points;
        }
      }
    }
  }
  
  return points;
}

/**
 * Выполняет трассировку лучей и создаёт видимую область в виде конуса
 * @param {Object} player - Объект игрока
 * @param {Object} customMap - Карта (опционально)
 * @param {number} viewDistance - Максимальная дистанция видимости
 * @param {number} coneAngle - Угол конуса видимости в радианах (по умолчанию 2.0 ≈ 115 градусов)
 * @returns {Array} - Массив видимых точек
 */
export function getVisibleTiles(player, customMap, viewDistance = 250, coneAngle = 2.0) {
  // Используем переданную карту или дефолтную, импортированную сверху
  const currentMap = customMap || map;
  
  // Проверяем на изменения положения игрока
  if (visionCache && 
      player.x === lastPlayerX && 
      player.y === lastPlayerY && 
      player.angle === lastPlayerAngle) {
    return visionCache;
  }
  
  const startTime = performance.now();
  
  // Создаём конус видимости (только 20 лучей вместо 360)
  const rayCount = 20;
  const halfCone = coneAngle / 2;
  
  // Начальная позиция игрока
  const startX = player.x;
  const startY = player.y;
  const playerAngle = player.angle;
  
  let visible = [];
  
  // Добавляем область непосредственно вокруг игрока (область ближнего зрения)
  const nearVisionRadius = 50;
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
    const nearX = startX + Math.cos(a) * nearVisionRadius;
    const nearY = startY + Math.sin(a) * nearVisionRadius;
    visible.push({ x: nearX, y: nearY });
  }
  
  // Бросаем лучи вперёд в конусе видимости
  for (let i = 0; i < rayCount; i++) {
    // Угол текущего луча (от -halfCone до +halfCone относительно направления игрока)
    const rayAngle = playerAngle - halfCone + (coneAngle * i / (rayCount - 1));
    
    // Бросаем луч и добавляем все его точки
    const rayPoints = castRay(startX, startY, rayAngle, viewDistance, currentMap);
    visible = visible.concat(rayPoints);
  }
  
  // Сохраняем кэш и положение игрока
  visionCache = visible;
  lastPlayerX = player.x;
  lastPlayerY = player.y;
  lastPlayerAngle = player.angle;
  
  const endTime = performance.now();
  // Логируем время выполнения для отладки производительности
  if (endTime - startTime > 16) { // Больше 16ms (60 FPS)
    debug(`Расчёт видимости занял ${(endTime - startTime).toFixed(2)}ms (медленно!)`, 'warn');
  }
  
  return visible;
}

/**
 * Отрисовка "тумана войны" - скрытие всего, кроме видимой области
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {Array} visiblePoints - Массив видимых точек
 */
export function drawFog(ctx, visiblePoints) {
  if (!visiblePoints || !visiblePoints.length) return;
  
  // Сохраняем состояние контекста
  ctx.save();
  
  // Заливаем весь экран тёмным цветом
  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
  // Режим наложения: вырезаем видимые области из темноты
  ctx.globalCompositeOperation = 'destination-out';
  
  // Для более плавного перехода используем градиент
  for (const point of visiblePoints) {
    // Вместо маленьких кругов на каждой точке, используем меньше, но больших градиентов
    const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, 30);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(point.x, point.y, 30, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Восстанавливаем состояние контекста
  ctx.restore();
}

// Сброс кэша видимости
export function invalidateVisionCache() {
  visionCache = null;
}