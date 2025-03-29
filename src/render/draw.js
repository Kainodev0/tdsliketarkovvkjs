import { debug } from '../engine/debugger.js';
import { drawMap, map } from '../engine/map.js';
import { drawInventory } from '../systems/inventory/inventoryUI.js';
import { getVisibleTiles, applyVisionEffect } from '../systems/visionSystem.js';

/**
 * Главная функция отрисовки игры
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {Object} player - Объект игрока
 */
export function draw(ctx, player) {
  // Сохраняем исходное состояние контекста
  ctx.save();

  // Вычисляем смещение камеры (центрирование на игроке)
  const offsetX = player.x - ctx.canvas.width / 2;
  const offsetY = player.y - ctx.canvas.height / 2;
  
  // Смещаем камеру к игроку
  ctx.translate(-offsetX, -offsetY);

  // 1. Сначала рисуем всю карту полностью
  drawMap(ctx);

  // 2. Рисуем лут и других персонажей (сейчас в drawMap)
  
  // 3. Рисуем главного игрока
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);
  ctx.fillStyle = player.color || '#4af';
  ctx.beginPath();
  ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(player.radius + 10, 0);
  ctx.stroke();
  ctx.restore();

  // 4. Получаем данные о видимости
  const visibilityData = getVisibleTiles(player, map);
  
  // 5. Применяем эффект области видимости (затемняем невидимые области)
  applyVisionEffect(ctx, visibilityData);
  
  // Восстанавливаем контекст после всех смещений камеры
  ctx.restore();

  // 6. Рисуем HUD и интерфейс поверх всего остального
  if (window.gameState?.showInventory) {
    drawInventory(ctx, player.inventory);
  }
}