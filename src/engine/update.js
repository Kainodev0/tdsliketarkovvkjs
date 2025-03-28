// src/engine/update.js

import { keys, mouse } from './input.js';
import { map } from './map.js';
import { updateProjectiles } from '../systems/weaponSystem.js';
import { invalidateVisionCache } from '../systems/visionSystem.js';

/**
 * Проверка коллизий: пересекается ли окружность с какой-либо стеной
 */
function isColliding(x, y, radius) {
  for (const wall of map.walls) {
    const withinX = x + radius > wall.x && x - radius < wall.x + wall.w;
    const withinY = y + radius > wall.y && y - radius < wall.y + wall.h;
    if (withinX && withinY) return true;
  }
  return false;
}

/**
 * Основной апдейт игрока и снарядов
 */
export function update(player, deltaTime = 1 / 60) {
  // Следующая позиция
  let nextX = player.x;
  let nextY = player.y;

  // Обработка клавиш движения
  if (keys['w']) nextY -= player.speed;
  if (keys['s']) nextY += player.speed;
  if (keys['a']) nextX -= player.speed;
  if (keys['d']) nextX += player.speed;

  // Коллизии по X и Y отдельно (чтобы можно было «скользить» вдоль стен)
  const oldX = player.x;
  const oldY = player.y;

  if (!isColliding(nextX, player.y, player.radius)) player.x = nextX;
  if (!isColliding(player.x, nextY, player.radius)) player.y = nextY;

  // Если координаты изменились — сбрасываем кэш видимости
  if (oldX !== player.x || oldY !== player.y) {
    invalidateVisionCache();
  }

  // Обновление снарядов (пули, гранаты и т.п.)
  updateProjectiles(deltaTime);

  // Обновление оружия (например, перезарядка) — TODO
  if (player.weapon) {
    // updateWeapon(player, deltaTime); // Подключить позже
  }
}
