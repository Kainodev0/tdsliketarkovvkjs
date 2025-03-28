import { keys } from './input.js';
import { map } from './map.js';
import { updateProjectiles } from '../systems/weaponSystem.js';
import { invalidateVisionCache } from '../systems/visionSystem.js';

function isColliding(x, y, radius) {
  for (const wall of map.walls) {
    const withinX = x + radius > wall.x && x - radius < wall.x + wall.w;
    const withinY = y + radius > wall.y && y - radius < wall.y + wall.h;
    if (withinX && withinY) return true;
  }
  return false;
}

export function update(player) {
  let moveX = 0, moveY = 0;
  if (keys['w']) moveY -= 1;
  if (keys['s']) moveY += 1;
  if (keys['a']) moveX -= 1;
  if (keys['d']) moveX += 1;

  // Нормализация скорости при движении по диагонали
  if (moveX !== 0 && moveY !== 0) {
    moveX *= 0.7071;
    moveY *= 0.7071;
  }

  const nextX = player.x + moveX * player.speed;
  const nextY = player.y + moveY * player.speed;

  if (!isColliding(nextX, player.y, player.radius)) {
    player.x = nextX;
  }
  if (!isColliding(player.x, nextY, player.radius)) {
    player.y = nextY;
  }

  updateProjectiles(1/60);
  invalidateVisionCache();
}
