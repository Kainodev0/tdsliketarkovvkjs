// src/engine/update.js
// Максимально простая система движения

import { keys } from './input.js';
import { map } from './map.js';
import { debug } from './debugger.js';
import { invalidateVisionCache } from '../systems/visionSystem.js';

/**
 * Проверяет столкновения с границами карты и стенами
 */
function checkCollision(x, y, radius) {
  // Если карты нет - нет и коллизий
  if (!map || !map.walls) return false;
  
  // Проверяем столкновения со стенами
  for (const wall of map.walls) {
    // Находим ближайшую к игроку точку стены
    const closestX = Math.max(wall.x, Math.min(x, wall.x + wall.w));
    const closestY = Math.max(wall.y, Math.min(y, wall.y + wall.h));
    
    // Расстояние от этой точки до центра игрока
    const distX = x - closestX;
    const distY = y - closestY;
    const distSquared = distX * distX + distY * distY;
    
    // Если расстояние меньше радиуса - коллизия
    if (distSquared < radius * radius) {
      return true;
    }
  }
  
  return false;
}

/**
 * Обновляет состояние игры
 */
export function update(player) {
  // Проверяем наличие игрока
  if (!player) {
    debug("❌ Игрок не определен!", "error");
    return;
  }
  
  // Устанавливаем скорость, если она не определена
  if (typeof player.speed !== 'number' || isNaN(player.speed)) {
    player.speed = 5;
    debug("⚠️ Скорость игрока не была определена, установлено значение: 5");
  }
  
  // Запоминаем начальное положение для отслеживания изменений
  const startX = player.x;
  const startY = player.y;
  
  // Определяем направление движения
  let dx = 0;
  let dy = 0;
  
  // Управление с клавиатуры
  if (keys.w || keys.arrowup) dy -= 1;
  if (keys.s || keys.arrowdown) dy += 1;
  if (keys.a || keys.arrowleft) dx -= 1;
  if (keys.d || keys.arrowright) dx += 1;
  
  // Если есть движение
  if (dx !== 0 || dy !== 0) {
    // Нормализуем движение по диагонали
    if (dx !== 0 && dy !== 0) {
      const len = Math.sqrt(dx*dx + dy*dy);
      dx /= len;
      dy /= len;
    }
    
    // Рассчитываем новую позицию
    const newX = player.x + dx * player.speed;
    const newY = player.y + dy * player.speed;
    
    // Отдельная проверка движения по X и Y для возможности скользить вдоль стен
    if (!checkCollision(newX, player.y, player.radius)) {
      player.x = newX;
    }
    
    if (!checkCollision(player.x, newY, player.radius)) {
      player.y = newY;
    }
    
    // Если позиция изменилась, сбрасываем кеш видимости
    if (player.x !== startX || player.y !== startY) {
      invalidateVisionCache();
      debug(`Игрок переместился: [${player.x.toFixed(0)}, ${player.y.toFixed(0)}]`);
    }
  }
}