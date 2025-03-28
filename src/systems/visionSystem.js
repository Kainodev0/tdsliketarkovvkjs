// Кэш видимых точек и координаты последнего положения игрока
let visionCache = null;
let lastPlayerX = null;
let lastPlayerY = null;

// Импортируем map напрямую, чтобы не зависеть от window.map
import { map } from '../engine/map.js';

// Функция расчёта видимых точек вокруг игрока
export function getVisibleTiles(player, customMap, viewDistance = 200) {
  // Используем переданную карту или дефолтную, импортированную сверху
  const currentMap = customMap || map;
  
  // Если координаты игрока не изменились — возвращаем кэш
  if (
    visionCache &&
    player.x === lastPlayerX &&
    player.y === lastPlayerY
  ) {
    return visionCache;
  }

  const visible = [];      // Сюда будем складывать все видимые точки
  const step = 5;          // Шаг луча в пикселях (чем меньше — тем точнее, но медленнее)
  const angles = 360;      // Кол-во направлений (лучей) — 360 (один на каждый градус)

  // Проходим по всем направлениям (градусам)
  for (let a = 0; a < angles; a += 1) {
    const angle = (a * Math.PI) / 180; // Переводим градусы в радианы
    let x = player.x;
    let y = player.y;

    // Двигаемся лучом вперёд от центра игрока до максимальной дистанции
    for (let d = 0; d < viewDistance; d += step) {
      x += Math.cos(angle) * step;
      y += Math.sin(angle) * step;

      visible.push({ x, y }); // Добавляем точку в массив видимых

      // Если луч пересекается со стеной — останавливаем его
      // Проверяем наличие и стен в карте
      if (currentMap && currentMap.walls) {
        for (const wall of currentMap.walls) {
          if (
            x > wall.x &&
            x < wall.x + wall.w &&
            y > wall.y &&
            y < wall.y + wall.h
          ) {
            d = viewDistance; // выходим из цикла
            break;
          }
        }
      }
    }
  }

  // Сохраняем результат в кэш
  visionCache = visible;
  lastPlayerX = player.x;
  lastPlayerY = player.y;

  return visible; // Возвращаем массив видимых точек
}

// Отрисовка тумана войны (скрытие всего, кроме видимого)
export function drawFog(ctx, visiblePoints) {
  // Заливаем весь экран полупрозрачным чёрным
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Меняем режим наложения: будем вырезать «видимые» области
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();

  // Создаём вырезы по видимым точкам
  visiblePoints.forEach(p => {
    ctx.moveTo(p.x, p.y);
    ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
  });

  ctx.fill();     // Удаляем области видимости из «тумана»
  ctx.restore();  // Возвращаем обычный режим рисования
}

// Явный сброс кэша (например, при телепортации или изменении карты)
export function invalidateVisionCache() {
  visionCache = null;
}