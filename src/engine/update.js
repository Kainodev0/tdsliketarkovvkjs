// src/engine/update.js
import { keys } from './input.js';
import { map } from './map.js';
import { updateProjectiles } from '../systems/weaponSystem.js';
import { invalidateVisionCache } from '../systems/visionSystem.js';
import { debug } from './debugger.js';

/**
 * Проверяет коллизию точки со стеной
 * @param {number} x - X координата
 * @param {number} y - Y координата
 * @param {number} radius - Радиус объекта
 * @returns {boolean} - Происходит ли коллизия
 */
function isCollidingWithWalls(x, y, radius) {
  // Если карты нет, считаем что коллизии нет
  if (!map || !map.walls) {
    debug("Ошибка: карта не найдена в isCollidingWithWalls", "error");
    return false;
  }
  
  for (const wall of map.walls) {
    // Проверяем пересечение окружности со стеной
    const closestX = Math.max(wall.x, Math.min(x, wall.x + wall.w));
    const closestY = Math.max(wall.y, Math.min(y, wall.y + wall.h));
    
    // Вычисляем расстояние между ближайшей точкой и центром игрока
    const distanceX = x - closestX;
    const distanceY = y - closestY;
    const distanceSquared = distanceX * distanceX + distanceY * distanceY;
    
    // Если расстояние меньше радиуса игрока, то коллизия происходит
    if (distanceSquared <= radius * radius) {
      return true;
    }
  }
  
  return false;
}

/**
 * Главная функция обновления состояния игры
 * @param {Object} player - Объект игрока
 */
export function update(player) {
  // Проверки на существование объекта игрока
  if (!player) {
    debug("Ошибка: объект player не определён", "error");
    return;
  }
  
  // Сохраняем старые координаты для последующего сравнения
  const oldX = player.x;
  const oldY = player.y;
  
  // Вектор движения
  let moveX = 0;
  let moveY = 0;
  
  // Получаем направление движения из нажатых клавиш
  if (keys['w'] || keys['arrowup']) moveY -= 1;
  if (keys['s'] || keys['arrowdown']) moveY += 1;
  if (keys['a'] || keys['arrowleft']) moveX -= 1;
  if (keys['d'] || keys['arrowright']) moveX += 1;
  
  // Если движение происходит, обрабатываем его
  if (moveX !== 0 || moveY !== 0) {
    // Нормализуем диагональное движение, чтобы оно не было быстрее
    if (moveX !== 0 && moveY !== 0) {
      // √2/2 ≈ 0.7071 - коэффициент для нормализации диагонального движения
      moveX *= 0.7071;
      moveY *= 0.7071;
    }
    
    // Применяем скорость движения
    const deltaX = moveX * player.speed;
    const deltaY = moveY * player.speed;
    
    // Пытаемся переместиться по X и Y отдельно с учётом коллизий
    const nextX = player.x + deltaX;
    const nextY = player.y + deltaY;
    
    // Отладочное сообщение для проверки координат
    // debug(`Attempt move to X:${nextX}, Y:${nextY} from X:${player.x}, Y:${player.y}`);
    
    // Проверяем и выполняем движение по X, если нет коллизии
    if (!isCollidingWithWalls(nextX, player.y, player.radius)) {
      player.x = nextX;
    }
    
    // Проверяем и выполняем движение по Y, если нет коллизии
    if (!isCollidingWithWalls(player.x, nextY, player.radius)) {
      player.y = nextY;
    }
    
    // Если координаты изменились, сбрасываем кэш видимости
    if (oldX !== player.x || oldY !== player.y) {
      invalidateVisionCache();
    }
  }
  
  // Обновляем снаряды
  if (typeof updateProjectiles === 'function') {
    updateProjectiles(1 / 60); // Предполагаем 60 FPS
  }
}