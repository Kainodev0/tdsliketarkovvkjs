// src/engine/input.js
// Максимально простая версия системы ввода

import { debug } from './debugger.js';

// Состояние клавиш
export const keys = {
  w: false,
  a: false,
  s: false,
  d: false,
  arrowup: false,
  arrowdown: false,
  arrowleft: false,
  arrowright: false
};

// Позиция мыши в мировых координатах
export const mouse = { x: 0, y: 0 };

/**
 * Настраивает обработчики ввода
 */
export function setupInput(canvas) {
  debug("🎮 Инициализация системы ввода");
  
  // Обработчик нажатия клавиш
  document.addEventListener('keydown', function(e) {
    const key = e.key.toLowerCase();
    keys[key] = true;
    debug(`Клавиша нажата: ${key}`);
    
    // Tab для инвентаря
    if (key === 'tab') {
      e.preventDefault();
      window.gameState.showInventory = !window.gameState.showInventory;
    }
  });
  
  // Обработчик отпускания клавиш
  document.addEventListener('keyup', function(e) {
    const key = e.key.toLowerCase();
    keys[key] = false;
    debug(`Клавиша отпущена: ${key}`);
  });
  
  // Проверка canvas
  if (!canvas) {
    debug("❌ Canvas не найден!", "error");
    return;
  }
  
  // Обработчик движения мыши
  canvas.addEventListener('mousemove', function(e) {
    // Получаем размеры и позицию canvas
    const rect = canvas.getBoundingClientRect();
    
    // Позиция мыши на canvas с учетом масштабирования
    const canvasX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const canvasY = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    // Если игрок существует
    if (window.player) {
      // Преобразуем в мировые координаты (с учетом положения камеры)
      const cameraOffsetX = window.player.x - canvas.width / 2;
      const cameraOffsetY = window.player.y - canvas.height / 2;
      
      mouse.x = canvasX + cameraOffsetX;
      mouse.y = canvasY + cameraOffsetY;
      
      // Обновляем угол поворота игрока (направление взгляда)
      window.player.angle = Math.atan2(mouse.y - window.player.y, mouse.x - window.player.x);
    }
  });
  
  // Обработчик потери фокуса - сбрасываем все клавиши
  window.addEventListener('blur', function() {
    for (const key in keys) {
      keys[key] = false;
    }
    debug("Сброс состояния клавиш (потеря фокуса)");
  });
  
  debug("✅ Система ввода инициализирована");
}