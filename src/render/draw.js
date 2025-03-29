// src/render/draw.js
// Полностью переработанная функция отрисовки

import { debug } from '../engine/debugger.js';
import { drawMap, map } from '../engine/map.js';
import { assets } from '../systems/assetLoader.js';
import { getVisibleTiles, isPointVisible, isScreenPointInVisionCone } from '../systems/visionSystem.js';

// Константа для определения радиуса ближнего зрения
const CLOSE_VISION_RADIUS = 50;

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
 * Отрисовывает элемент декорации (дерево, камень) в зависимости от видимости
 */
function drawDecoration(ctx, decoration, visibilityData) {
  if (isPointVisible(decoration, visibilityData)) {
    if (decoration.type === 'tree') {
      // Ствол
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(decoration.x - 5, decoration.y - 5, 10, 20);
      
      // Крона
      ctx.fillStyle = '#228B22';
      ctx.beginPath();
      ctx.arc(decoration.x, decoration.y - 15, 15, 0, Math.PI * 2);
      ctx.fill();
    } else if (decoration.type === 'rock') {
      ctx.fillStyle = '#777';
      ctx.beginPath();
      ctx.arc(decoration.x, decoration.y, decoration.size || 15, 0, Math.PI * 2);
      ctx.fill();
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
 * Отрисовывает стену с учетом видимости
 */
function drawWall(ctx, wall, visibilityData, cameraOffsetX, cameraOffsetY) {
  // Проверяем видимость углов стены
  const corners = [
    { x: wall.x, y: wall.y },
    { x: wall.x + wall.w, y: wall.y },
    { x: wall.x, y: wall.y + wall.h },
    { x: wall.x + wall.w, y: wall.y + wall.h }
  ];
  
  // Если хотя бы один угол видим, рисуем стену
  let isAnyCornerVisible = false;
  for (const corner of corners) {
    if (isPointVisible(corner, visibilityData)) {
      isAnyCornerVisible = true;
      break;
    }
  }
  
  if (isAnyCornerVisible) {
    ctx.fillStyle = wall.color || '#444';
    
    // Если есть вращение, применяем его
    if (wall.rotation) {
      ctx.save();
      ctx.translate(wall.x + wall.w / 2, wall.y + wall.h / 2);
      ctx.rotate(wall.rotation);
      ctx.fillRect(-wall.w / 2, -wall.h / 2, wall.w, wall.h);
      ctx.restore();
    } else {
      ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    }
  }
}

/**
 * Отрисовывает местность с учетом видимости
 */
function drawTerrain(ctx, terrain, visibilityData, cameraOffsetX, cameraOffsetY) {
  // Проверяем видимость углов территории
  const corners = [
    { x: terrain.x, y: terrain.y },
    { x: terrain.x + terrain.w, y: terrain.y },
    { x: terrain.x, y: terrain.y + terrain.h },
    { x: terrain.x + terrain.w, y: terrain.y + terrain.h }
  ];
  
  // Для местности достаточно, чтобы хотя бы один угол был видим
  let isAnyCornerVisible = false;
  for (const corner of corners) {
    if (isPointVisible(corner, visibilityData)) {
      isAnyCornerVisible = true;
      break;
    }
  }
  
  if (isAnyCornerVisible) {
    ctx.fillStyle = terrain.color || '#333';
    ctx.fillRect(terrain.x, terrain.y, terrain.w, terrain.h);
  }
}

/**
 * Отрисовывает карту с учетом видимости
 */
function drawVisibleMap(ctx, visibilityData, cameraOffsetX, cameraOffsetY) {
  // Сначала заполняем всю карту черным (невидимым) фоном
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, map.width, map.height);
  
  // Рисуем типы местности (только видимые участки)
  if (map.terrain) {
    for (const terrain of map.terrain) {
      drawTerrain(ctx, terrain, visibilityData, cameraOffsetX, cameraOffsetY);
    }
  }
  
  // Рисуем зоны эвакуации (если они в зоне видимости)
  if (map.extractionZones) {
    for (const zone of map.extractionZones) {
      if (isPointVisible(zone, visibilityData)) {
        // Внешний круг
        ctx.beginPath();
        ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(50, 205, 50, 0.2)';
        ctx.fill();
        
        // Граница
        ctx.beginPath();
        ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(50, 205, 50, 0.8)';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Название зоны
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(zone.name, zone.x, zone.y);
      }
    }
  }
  
  // Рисуем стены (только видимые)
  for (const wall of map.walls) {
    drawWall(ctx, wall, visibilityData, cameraOffsetX, cameraOffsetY);
  }
  
  // Рисуем декоративные элементы (деревья, камни)
  // Создаем коллекцию декораций для отрисовки
  const decorations = [];
  
  // Деревья
  const trees = [
    { type: 'tree', x: 200, y: 100 },
    { type: 'tree', x: 400, y: 150 },
    { type: 'tree', x: 600, y: 200 },
    { type: 'tree', x: 1500, y: 450 },
    { type: 'tree', x: 1700, y: 600 },
    { type: 'tree', x: 300, y: 1000 },
    { type: 'tree', x: 500, y: 1200 }
  ];
  
  // Камни
  const rocks = [
    { type: 'rock', x: 100, y: 300, size: 15 },
    { type: 'rock', x: 350, y: 700, size: 20 },
    { type: 'rock', x: 1200, y: 300, size: 25 },
    { type: 'rock', x: 1600, y: 1100, size: 18 },
    { type: 'rock', x: 900, y: 1300, size: 22 }
  ];
  
  // Добавляем все декорации в один массив
  decorations.push(...trees, ...rocks);
  
  // Рисуем только видимые декорации
  for (const decoration of decorations) {
    drawDecoration(ctx, decoration, visibilityData);
  }
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
    
    // Очищаем весь canvas перед отрисовкой нового кадра
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Рассчитываем смещение камеры (относительно игрока)
    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;
    const cameraX = player.x - canvasWidth / 2;
    const cameraY = player.y - canvasHeight / 2;
    
    // Получаем данные о видимости
    const visibilityData = getVisibleTiles(player, map);
    
    // Сохраняем состояние контекста
    ctx.save();
    
    // Смещаем "мир" относительно камеры
    ctx.translate(-cameraX, -cameraY);
    
    // Отрисовываем карту с учетом видимости
    drawVisibleMap(ctx, visibilityData, cameraX, cameraY);
    
    // Отрисовываем предметы лута (только видимые)
    drawLoot(ctx, visibilityData);
    
    // Отрисовываем игрока
    drawPlayer(ctx, player);
    
    // Восстанавливаем состояние контекста
    ctx.restore();
    
    // Отрисовываем интерфейс (если он есть)
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