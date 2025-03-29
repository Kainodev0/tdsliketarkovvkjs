// src/render/draw.js
// Упрощенная система отрисовки

import { debug } from '../engine/debugger.js';
import { drawMap, map } from '../engine/map.js';
import { assets } from '../systems/assetLoader.js';
import { getVisibleTiles, applyVisionEffect, isPointVisible } from '../systems/visionSystem.js';

/**
 * Отрисовывает лут на карте
 */
function drawLoot(ctx, visibilityData) {
  // Проверка наличия лута
  if (!map || !map.loot || !Array.isArray(map.loot)) return;
  
  // Перебираем предметы лута
  for (const item of map.loot) {
    // Проверяем, находится ли предмет в зоне видимости
    if (isPointVisible(item, visibilityData)) {
      // Рисуем предмет
      let color;
      
      // Определяем цвет по типу предмета
      switch (item.id) {
        case 'medkit':
          color = '#e74c3c'; // красный
          break;
        case 'crate':
          color = '#8B4513'; // коричневый
          break;
        case 'ammo_box':
          color = '#f39c12'; // оранжевый
          break;
        default:
          color = '#0af';    // синий (по умолчанию)
      }
      
      // Рисуем квадрат для лута
      ctx.fillStyle = color;
      ctx.fillRect(item.x - 20, item.y - 20, 40, 40);
      
      // Добавляем обводку
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(item.x - 20, item.y - 20, 40, 40);
    }
  }
}

/**
 * Отрисовывает игрока
 */
function drawPlayer(ctx, player) {
  if (!player) return;
  
  ctx.save();
  
  // Перемещаемся в позицию игрока
  ctx.translate(player.x, player.y);
  
  // Поворачиваемся в направлении взгляда
  ctx.rotate(player.angle);
  
  // Рисуем круг (тело)
  ctx.fillStyle = player.color || '#4af';
  ctx.beginPath();
  ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
  ctx.fill();
  
  // Рисуем линию (направление взгляда)
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(player.radius + 10, 0);
  ctx.stroke();
  
  ctx.restore();
}

/**
 * Основная функция отрисовки игры
 */
export function draw(ctx, player) {
  try {
    // Проверка наличия контекста и игрока
    if (!ctx || !player) {
      debug("❌ Ошибка отрисовки: не определен контекст или игрок", "error");
      return;
    }
    
    // Сохраняем состояние контекста
    ctx.save();
    
    // Центрируем камеру на игроке
    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;
    const cameraX = player.x - canvasWidth / 2;
    const cameraY = player.y - canvasHeight / 2;
    
    // Смещаем "мир" относительно камеры
    ctx.translate(-cameraX, -cameraY);
    
    // 1. Рисуем карту (фон и стены)
    drawMap(ctx);
    
    // 2. Получаем данные о видимости
    const visibilityData = getVisibleTiles(player, map);
    
    // 3. Рисуем лут (только в зоне видимости)
    drawLoot(ctx, visibilityData);
    
    // 4. Рисуем игрока
    drawPlayer(ctx, player);
    
    // 5. Применяем эффект видимости (черно-белое вне зоны видимости)
    applyVisionEffect(ctx, visibilityData);
    
    // Восстанавливаем состояние контекста
    ctx.restore();
    
    // Рисуем интерфейс, если он есть
    if (window.gameState && window.gameState.showInventory) {
      if (typeof drawInventory === 'function') {
        try {
          drawInventory(ctx, player.inventory);
        } catch (error) {
          debug(`Ошибка при отрисовке инвентаря: ${error.message}`, "error");
        }
      }
    }
  } catch (error) {
    debug(`❌ Ошибка при отрисовке: ${error.message}`, "error");
    console.error(error);
  }
}