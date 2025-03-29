// src/systems/visionSystem.js
// Версия с максимальным упрощением, которая гарантированно должна работать

import { map } from '../engine/map.js';
import { debug } from '../engine/debugger.js';

// Глобальные переменные для кеширования
let visionCache = null;
let lastPlayerX = null;
let lastPlayerY = null;
let lastPlayerAngle = null;

/**
 * Создаёт данные о видимости для игрока
 */
export function getVisibleTiles(player, customMap, viewDistance = 500, coneAngle = 2.0) {
  // Используем любую карту, которая доступна
  const currentMap = customMap || map || { walls: [] };
  
  // Базовые проверки
  if (!player) {
    debug("Ошибка: игрок не определён", "error");
    return { points: [], coneTip: { x: 0, y: 0 }, angle: 0, coneAngle: 0, viewDistance: 0 };
  }

  // Получаем координаты игрока
  const playerX = player.x || 0;
  const playerY = player.y || 0;
  const playerAngle = player.angle || 0;
  
  // Проверка кеша (если положение не изменилось, используем кеш)
  if (visionCache && 
      playerX === lastPlayerX && 
      playerY === lastPlayerY && 
      playerAngle === lastPlayerAngle) {
    return visionCache;
  }
  
  // Создаём простой конус видимости без рейкастинга
  const rayCount = 40;
  const halfCone = coneAngle / 2;
  const rayPoints = [];
  
  // Добавляем начальную точку (позицию игрока)
  rayPoints.push({ x: playerX, y: playerY });
  
  // Создаём лучи по кругу
  for (let i = 0; i <= rayCount; i++) {
    const rayAngle = playerAngle - halfCone + (coneAngle * i / rayCount);
    const x = playerX + Math.cos(rayAngle) * viewDistance;
    const y = playerY + Math.sin(rayAngle) * viewDistance;
    rayPoints.push({ x, y });
  }
  
  // Создаём структуру данных для видимости
  const visibilityData = {
    coneTip: { x: playerX, y: playerY },
    points: rayPoints,
    angle: playerAngle,
    coneAngle: coneAngle,
    viewDistance: viewDistance
  };
  
  // Сохраняем кеш
  visionCache = visibilityData;
  lastPlayerX = playerX;
  lastPlayerY = playerY;
  lastPlayerAngle = playerAngle;
  
  return visibilityData;
}

/**
 * Проверяет, видима ли точка игроком
 */
export function isPointVisible(point, visibilityData) {
  // Если нет данных о видимости, считаем всё видимым
  if (!visibilityData || !visibilityData.points || visibilityData.points.length < 3) {
    return true;
  }
  
  const playerX = visibilityData.coneTip.x;
  const playerY = visibilityData.coneTip.y;
  
  // Если точка слишком близко - всегда видима
  const dx = point.x - playerX;
  const dy = point.y - playerY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance < 50) {
    return true;
  }
  
  // Если точка дальше, чем видимость - не видна
  if (distance > visibilityData.viewDistance) {
    return false;
  }
  
  // Простая проверка по углу
  const angle = Math.atan2(dy, dx);
  const playerAngle = visibilityData.angle;
  
  // Нормализуем углы
  const normalizeAngle = (a) => {
    while (a < -Math.PI) a += 2 * Math.PI;
    while (a > Math.PI) a -= 2 * Math.PI;
    return a;
  };
  
  const angleDiff = Math.abs(normalizeAngle(playerAngle) - normalizeAngle(angle));
  const halfCone = visibilityData.coneAngle / 2;
  
  return angleDiff <= halfCone || angleDiff >= (2 * Math.PI - halfCone);
}

/**
 * Применяет эффект видимости (чёрно-белая область вне конуса)
 */
export function applyVisionEffect(ctx, visibilityData) {
  if (!visibilityData || !visibilityData.points || visibilityData.points.length < 3) {
    return;
  }
  
  // Получаем размеры канваса
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  
  try {
    // Создаём отдельный канвас для маски
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = width;
    maskCanvas.height = height;
    const maskCtx = maskCanvas.getContext('2d');
    
    // Рисуем конус видимости (белым по чёрному)
    maskCtx.fillStyle = 'black';
    maskCtx.fillRect(0, 0, width, height);
    
    maskCtx.fillStyle = 'white';
    maskCtx.beginPath();
    maskCtx.moveTo(visibilityData.coneTip.x, visibilityData.coneTip.y);
    
    for (let i = 1; i < visibilityData.points.length; i++) {
      maskCtx.lineTo(visibilityData.points[i].x, visibilityData.points[i].y);
    }
    
    maskCtx.closePath();
    maskCtx.fill();
    
    // Круг вокруг игрока
    maskCtx.beginPath();
    maskCtx.arc(
      visibilityData.coneTip.x, 
      visibilityData.coneTip.y, 
      50, // Радиус ближнего зрения
      0, 
      Math.PI * 2
    );
    maskCtx.fill();
    
    // Сделаем копию текущей сцены (цветной)
    const originalScene = ctx.getImageData(0, 0, width, height);
    
    // Сделаем чёрно-белую версию сцены
    const graySceneData = new Uint8ClampedArray(originalScene.data);
    for (let i = 0; i < graySceneData.length; i += 4) {
      const avg = (graySceneData[i] + graySceneData[i + 1] + graySceneData[i + 2]) / 3;
      const dark = avg * 0.3; // Затемняем чёрно-белую область
      graySceneData[i] = dark;
      graySceneData[i + 1] = dark;
      graySceneData[i + 2] = dark;
    }
    const grayScene = new ImageData(graySceneData, width, height);
    
    // Накладываем чёрно-белую сцену
    ctx.putImageData(grayScene, 0, 0);
    
    // Накладываем маску конуса видимости
    ctx.globalCompositeOperation = 'destination-out';
    ctx.drawImage(maskCanvas, 0, 0);
    
    // Накладываем оригинальную цветную сцену только в области конуса
    ctx.globalCompositeOperation = 'source-atop';
    ctx.putImageData(originalScene, 0, 0);
    
    // Возвращаем нормальный режим наложения
    ctx.globalCompositeOperation = 'source-over';
    
  } catch (error) {
    debug(`Ошибка в applyVisionEffect: ${error.message}`, "error");
    console.error(error);
  }
}

// Сброс кеша
export function invalidateVisionCache() {
  visionCache = null;
}