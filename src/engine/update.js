import { keys } from './input.js';
import { map } from './map.js';

function isColliding(x, y, radius) {
  for (const wall of map.walls) {
    const withinX = x + radius > wall.x && x - radius < wall.x + wall.w;
    const withinY = y + radius > wall.y && y - radius < wall.y + wall.h;
    if (withinX && withinY) return true;
  }
  return false;
}

export function update(player) {
  let nextX = player.x;
  let nextY = player.y;

  if (keys['w']) nextY -= player.speed;
  if (keys['s']) nextY += player.speed;
  if (keys['a']) nextX -= player.speed;
  if (keys['d']) nextX += player.speed;

  if (!isColliding(nextX, player.y, player.radius)) player.x = nextX;
  if (!isColliding(player.x, nextY, player.radius)) player.y = nextY;
}
