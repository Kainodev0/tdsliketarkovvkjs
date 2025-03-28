// Подключаем необходимые модули
import { keys } from './input.js';
import { map } from './map.js';
import { updateProjectiles } from '../systems/weaponSystem.js';
import { invalidateVisionCache } from '../systems/visionSystem.js';

// Проверка коллизии игрока со стенами
function isColliding(x, y, radius) {
  for (const wall of map.walls) {
    const withinX = x + radius > wall.x && x - radius < wall.x + wall.w;
    const withinY = y + radius > wall.y && y - radius < wall.y + wall.h;
    if (withinX && withinY) return true;
  }
  return false;
}

// Главная функция обновления состояния игрока
export function update(player) {
  let moveX = 0, moveY = 0;

  // Обработка ввода с клавиатуры
  if (keys['w']) moveY -= 1;
  if (keys['s']) moveY += 1;
  if (keys['a']) moveX -= 1;
  if (keys['d']) moveX += 1;

  // Если игрок двигается по диагонали — нормализуем скорость
  if (moveX !== 0 && moveY !== 0) {
    moveX *= 0.7071; // ~1/√2
    moveY *= 0.7071;
  }

  // Запоминаем старые координаты для сравнения
  const oldX = player.x;
  const oldY = player.y;

  // Пытаемся переместиться по X и Y отдельно с учётом коллизий
  const nextX = player.x + moveX * player.speed;
  const nextY = player.y + moveY * player.speed;

  if (!isColliding(nextX, player.y, player.radius)) {
    player.x = nextX;
  }
  if (!isColliding(player.x, nextY, player.radius)) {
    player.y = nextY;
  }

  // Если координаты изменились — сбрасываем кэш видимости
  if (oldX !== player.x || oldY !== player.y) {
    invalidateVisionCache();
  }

  // Обновляем снаряды
  updateProjectiles(1 / 60);
}
