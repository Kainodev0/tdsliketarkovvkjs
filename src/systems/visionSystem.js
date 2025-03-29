// src/systems/visionSystem.js
// Упрощенная система видимости

import { map } from '../engine/map.js';
import { debug } from '../engine/debugger.js';

// Глобальные переменные для кеширования
let visionCache = null;
let lastPlayerX = null;
let lastPlayerY = null;
let lastPlayerAngle = null;

/**
 * Создает данные о видимости для игрока
 */
export function getVisibleTiles(player, customMap, viewDistance = 500, coneAngle = 2.0) {
  // Используем любую доступную карту
  const currentMap = customMap || map || { walls: [] };
  
  // Базовые проверки
  if (!player) {
    debug("Ошибка: игрок не определен", "error");
    return { points: [], coneTip: { x: 0, y: 0 }, angle: 0, coneAngle: 0, viewDistance: 0 };
  }

  // Получаем координаты игрока
  const playerX = player.x || 0;
  const playerY = player.y || 0;
  const playerAngle = player.angle || 0;
  
  // Проверяем кеш (если позиция не изменилась, используем кеш)
  if (visionCache && 
      playerX === lastPlayerX && 
      playerY === lastPlayerY && 
      playerAngle === lastPlayerAngle) {
    return visionCache;
  }
  
  // Создаем простой конус видимости без рейкастинга
  const rayCount = 40;
  const halfCone = coneAngle / 2;
  const rayPoints = [];
  
  // Добавляем начальную точку (позицию игрока)
  rayPoints.push({ x: playerX, y: playerY });
  
  // Создаем лучи по кругу
  for (let i = 0; i <= rayCount; i++) {
    const rayAngle = playerAngle - halfCone + (coneAngle * i / rayCount);
    const x = playerX + Math.cos(rayAngle) * viewDistance;
    const y = playerY + Math.sin(rayAngle) * viewDistance;
    rayPoints.push({ x, y });
  }
  
  // Создаем структуру данных для видимости
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
 * Проверяет, видна ли точка игроку
 */
export function isPointVisible(point, visibilityData) {
  // Если нет данных о видимости, считаем все видимым
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
  
  const angleDiff = Math.abs(normalizeAngle(angle) - normalizeAngle(playerAngle));
  const halfCone = visibilityData.coneAngle / 2;
  
  return angleDiff <= halfCone || angleDiff >= (2 * Math.PI - halfCone);
}

/**
 * Применяет эффект видимости (черно-белая область вне конуса)
 * Самая простая реализация, которая точно должна работать
 */
export function applyVisionEffect(ctx, visibilityData) {
  if (!visibilityData || !visibilityData.points || visibilityData.points.length < 3) {
    return;
  }
  
  try {
    // Размеры canvas
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Координаты камеры (смещение от игрока)
    const cameraOffsetX = visibilityData.coneTip.x - width / 2;
    const cameraOffsetY = visibilityData.coneTip.y - height / 2;
    
    // Сохраняем текущее состояние контекста
    ctx.save();
    
    // Создаем затемняющий прямоугольник на весь экран
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, width, height);
    
    // Вырезаем конус видимости методом "вычитания"
    ctx.globalCompositeOperation = 'destination-out';
    
    // Рисуем конус видимости (полная прозрачность)
    ctx.fillStyle = 'rgba(255, 255, 255, 1)';
    ctx.beginPath();
    
    // Первая точка - позиция игрока на экране
    const screenPlayerX = visibilityData.coneTip.x - cameraOffsetX;
    const screenPlayerY = visibilityData.coneTip.y - cameraOffsetY;
    
    ctx.moveTo(screenPlayerX, screenPlayerY);
    
    // Рисуем контур конуса
    for (let i = 1; i < visibilityData.points.length; i++) {
      const point = visibilityData.points[i];
      const screenX = point.x - cameraOffsetX;
      const screenY = point.y - cameraOffsetY;
      ctx.lineTo(screenX, screenY);
    }
    
    ctx.closePath();
    ctx.fill();
    
    // Рисуем маленький круг непосредственно вокруг игрока (ближнее зрение)
    ctx.beginPath();
    ctx.arc(screenPlayerX, screenPlayerY, 50, 0, Math.PI * 2);
    ctx.fill();
    
    // Восстанавливаем контекст
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
    
  } catch (error) {
    debug(`Ошибка в applyVisionEffect: ${error.message}`, "error");
    console.error(error);
  }
}

// Сбросить кеш
export function invalidateVisionCache() {
  visionCache = null;
}