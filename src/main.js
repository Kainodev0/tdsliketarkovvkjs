// src/main.js
// Упрощенная версия основного файла

import { setupInput } from './engine/input.js';
import { update } from './engine/update.js';
import { draw } from './render/draw.js';
import { debug, initDebugger, toggleDebug } from './engine/debugger.js';
import { player, initPlayer } from './engine/player.js';
import { map } from './engine/map.js';
import { loadAssets } from './systems/assetLoader.js';
import { monitorPerformance, drawPerformanceInfo } from './systems/performanceUtils.js';

// Основной игровой цикл
function gameLoop(timestamp) {
  try {
    // Метрики производительности
    const metrics = monitorPerformance(timestamp);
    
    // Получаем canvas и контекст
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // Очищаем canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Обновляем состояние игры
    update(window.player);
    
    // Отрисовываем игру
    draw(ctx, window.player);
    
    // Отображаем FPS
    if (window.gameState && window.gameState.showFPS) {
      drawPerformanceInfo(ctx, metrics);
    }
    
    // Продолжаем цикл
    requestAnimationFrame(gameLoop);
  } catch (error) {
    // Обработка ошибок
    debug(`❌ Ошибка в игровом цикле: ${error.message}`, "error");
    console.error(error);
    
    // Продолжаем цикл, несмотря на ошибку
    requestAnimationFrame(gameLoop);
  }
}

// Функция запуска игры
export async function startGame() {
  try {
    // Инициализируем отладчик
    initDebugger();
    debug('🚀 Запуск игры...');
    
    // Устанавливаем глобальное состояние
    window.gameState = {
      showInventory: false,
      scene: 'loading',
      showFPS: true,
      debug: true
    };
    
    // Инициализируем игрока
    window.player = initPlayer();
    debug(`✅ Игрок инициализирован на позиции [${window.player.x}, ${window.player.y}]`);
    
    // Сохраняем ссылку на карту
    window.map = map;
    
    // Получаем canvas
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) throw new Error('Canvas не найден!');
    
    // Настраиваем систему ввода
    setupInput(canvas);
    debug('✅ Система ввода готова');
    
    // Загружаем ресурсы
    debug('⏳ Загрузка ресурсов...');
    await loadAssets();
    debug('✅ Ресурсы загружены');
    
    // Скрываем экран загрузки
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) loadingScreen.style.display = 'none';
    
    // Устанавливаем сцену
    window.gameState.scene = 'map';
    
    // Запускаем игровой цикл
    debug('🎮 Запуск игрового цикла');
    requestAnimationFrame(gameLoop);
    
    // Включаем отладку
    toggleDebug(true);
    
  } catch (error) {
    debug(`❌ Критическая ошибка: ${error.message}`, "error");
    console.error('Полный стек ошибки:', error);
    
    // Показываем ошибку пользователю
    const debuggerDiv = document.getElementById('debugger');
    if (debuggerDiv) {
      debuggerDiv.classList.remove('collapsed');
      debuggerDiv.innerHTML += `<br><span style="color: red">Критическая ошибка: ${error.message}</span>`;
    }
  }
}

// Обработчик для кнопки отладки
document.addEventListener('DOMContentLoaded', () => {
  const debugButton = document.getElementById('debugButton');
  if (debugButton) {
    debugButton.addEventListener('click', () => {
      const dbg = document.getElementById('debugger');
      dbg.classList.toggle('collapsed');
      window.gameState.debug = !dbg.classList.contains('collapsed');
      toggleDebug(window.gameState.debug);
    });
  }
});