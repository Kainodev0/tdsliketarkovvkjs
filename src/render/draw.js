import { debug } from '../engine/debugger.js';
import { drawMap, map } from '../engine/map.js';
import { drawInventory } from '../systems/inventory/inventoryUI.js';
import { getVisibleTiles, drawFog } from '../systems/visionSystem.js';

export function draw(ctx, player) {

  ctx.save();

  const offsetX = player.x - ctx.canvas.width / 2;
  const offsetY = player.y - ctx.canvas.height / 2;
  ctx.translate(-offsetX, -offsetY);

  // 1. Рисуем карту
  drawMap(ctx);

  // 2. Рисуем игрока
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

  // 3. Система видимости (fog of war)
  // Используем напрямую импортированный map, а не window.map
  const visible = getVisibleTiles(player, map);
  drawFog(ctx, visible);

  ctx.restore();

  // 4. Рисуем инвентарь, если открыт
  if (window.gameState?.showInventory) {
    drawInventory(ctx, player.inventory);
  }
}