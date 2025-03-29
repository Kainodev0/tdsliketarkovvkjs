// src/render/draw.js
import { debug } from '../engine/debugger.js';
import { drawMap, map } from '../engine/map.js';
import { drawInventory } from '../systems/inventory/inventoryUI.js';
import { getVisibleTiles, applyVisionEffect, isPointVisible } from '../systems/visionSystem.js';
import { assets } from '../systems/assetLoader.js';

/**
 * Отрисовывает лут на карте
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {Object} visibilityData - Данные о видимости
 */
function drawLoot(ctx, visibilityData) {
  if (!map || !map.loot) return;
  
  // Отрисовываем лут только если он в зоне видимости
  for (const item of map.loot) {
    const itemPoint = { x: item.x, y: item.y };
    
    // Проверяем видимость лута
    if (isPointVisible(itemPoint, visibilityData)) {
      // Если спрайт есть, используем его
      if (item.id && assets.images[item.id]) {
        ctx.drawImage(
          assets.images[item.id], 
          item.x - 20, item.y - 20, 
          40, 40
        );
      } else {
        // Иначе рисуем базовую форму с цветом по типу
        ctx.fillStyle = (item.id === 'medkit') ? '#e74c3c' :
                       (item.id === 'crate') ? '#8B4513' :
                       (item.id === 'ammo_box') ? '#f39c12' : '#0af';
        ctx.fillRect(item.x - 20, item.y - 20, 40, 40);
        
        // Добавляем обводку
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(item.x - 20, item.y - 20, 40, 40);
      }
    }
  }
}

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

  // 1. Сначала рисуем всю карту (стены и фон)
  drawMap(ctx);
  
  // 2. Получаем данные о видимости
  const visibilityData = getVisibleTiles(player, map);
  
  // 3. Рисуем лут (он будет виден только в конусе видимости)
  drawLoot(ctx, visibilityData);
  
  // 4. Рисуем главного игрока
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
  
  // 5. Применяем эффект области видимости (затемняем невидимые области)
  applyVisionEffect(ctx, visibilityData);
  
  // Восстанавливаем контекст после всех смещений камеры
  ctx.restore();

  // 6. Рисуем HUD и интерфейс поверх всего остального
  if (window.gameState?.showInventory) {
    drawInventory(ctx, player.inventory);
  }
}