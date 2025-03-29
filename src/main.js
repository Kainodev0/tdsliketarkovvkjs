// src/main.js
import { setupInput } from './engine/input.js';
import { update } from './engine/update.js';
import { draw } from './render/draw.js';
import { debug, initDebugger, toggleDebug } from './engine/debugger.js';
import { player } from './engine/player.js';
import { map } from './engine/map.js';
import { generateStartingGear, addItemToInventory } from './systems/inventory/index.js';
import { loadAssets, debugAssets } from './systems/assetLoader.js';
import { monitorPerformance, drawPerformanceInfo, measureTime } from './systems/performanceUtils.js';

// Экспортируем глобальные объекты
window.player = player;
window.map = map;
window.gameState = { 
  showInventory: false,
  scene: 'loading',
  showFPS: true,
  debug: false
};

// Функция игрового цикла (будет вызываться в requestAnimationFrame)
function gameLoop(timestamp) {
  try {
    // Измеряем производительность
    const metrics = monitorPerformance(timestamp);
    
    // Отрисовываем игру, используя measureTime для отладки медленных операций
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // Очищаем холст
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Обновляем состояние игры
    measureTime(() => update(window.player), 'update');
    
    // Отрисовываем игровую сцену
    measureTime(() => draw(ctx, window.player), 'draw');
    
    // Отображаем FPS если включено
    if (window.gameState.showFPS) {
      drawPerformanceInfo(ctx, metrics, true);
    }
    
    // Запрашиваем следующий кадр
    requestAnimationFrame(gameLoop);
  } catch (err) {
    debug(`💥 Ошибка в gameLoop: ${err.message}`, 'error');
    console.error(err); // Полный стек ошибки в консоль
    requestAnimationFrame(gameLoop); // Продолжаем цикл, несмотря на ошибку
  }
}

// Функция запуска игры
export async function startGame() {
  try {
    // Инициализируем отладчик
    initDebugger();
    debug('📦 Инициализация игры...');
    
    // Получаем canvas
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) throw new Error('Canvas не найден!');
    
    // Проверяем и инициализируем игрока если нужно
    if (!window.player || !window.player.x || !window.player.y) {
      debug("⚠️ Игрок не инициализирован, создаём базовые параметры");
      window.player = window.player || {};
      window.player.x = 400;
      window.player.y = 300;
      window.player.angle = 0;
      window.player.speed = 5; 
      window.player.radius = 15;
      window.player.color = '#4af';
      window.player.health = 100;
      window.player.maxHealth = 100;
    }
    
    // Настраиваем ввод
    setupInput(canvas);
    debug('🎮 Управление готово');
    
    // Загружаем ассеты
    debug('⏳ Загружаем ассеты...');
    await loadAssets();
    debug('✅ Ассеты загружены');
    
    // Скрываем экран загрузки
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) loadingScreen.style.display = 'none';
    
    // Для отладки показываем загруженные ассеты
    debugAssets();
    
    // Генерируем стартовое снаряжение, если инвентарь есть
    if (window.player.inventory) {
      const startingItems = generateStartingGear();
      for (const item of startingItems) {
        const result = addItemToInventory(window.player.inventory, item);
        if (result) debug(`🎒 Добавлен предмет: ${item.name}`);
      }
    }
    
    // Устанавливаем сцену
    window.gameState.scene = 'map';
    debug('🗺️ Сцена установлена: map');
    
    // Отладочная информация о состоянии игрока
    debug(`Позиция игрока: x=${window.player.x}, y=${window.player.y}, speed=${window.player.speed}`);
    
    // Добавляем кнопку для отображения FPS
    const fpsToggleButton = document.createElement('button');
    fpsToggleButton.className = 'ui-button';
    fpsToggleButton.style.top = '90px';
    fpsToggleButton.style.right = '10px';
    fpsToggleButton.innerText = 'FPS';
    fpsToggleButton.addEventListener('click', () => {
      window.gameState.showFPS = !window.gameState.showFPS;
    });
    document.getElementById('gameUI').appendChild(fpsToggleButton);
    
    // Запускаем игровой цикл
    debug('🚀 Запускаем игровой цикл...');
    requestAnimationFrame(gameLoop);
    
    // Включаем отладку для помощи с диагностикой
    toggleDebug(true);
    
  } catch (error) {
    debug(`❌ Критическая ошибка: ${error.message}`, 'error');
    console.error(error); // Выводим полный стек ошибки в консоль
    
    // Отображаем ошибку пользователю
    const debuggerDiv = document.getElementById('debugger');
    if (debuggerDiv) {
      debuggerDiv.classList.remove('collapsed');
      debuggerDiv.innerHTML += `\n<span style="color: red;">Критическая ошибка: ${error.message}</span>`;
    }
  }
}

// Добавляем обработчик для кнопки отладки
document.addEventListener('DOMContentLoaded', () => {
  const debugButton = document.getElementById('debugButton');
  if (debugButton) {
    debugButton.addEventListener('click', () => {
      const dbg = document.getElementById('debugger');
      dbg.classList.toggle('collapsed');
      // Также включаем/отключаем логирование
      window.gameState.debug = !dbg.classList.contains('collapsed');
      toggleDebug(window.gameState.debug);
    });
  }
});