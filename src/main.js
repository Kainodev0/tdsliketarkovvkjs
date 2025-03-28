import { setupInput } from './engine/input.js';
import { update } from './engine/update.js';
import { draw } from './render/draw.js';
import { debug, initDebugger, toggleDebug } from './engine/debugger.js';
import { player } from './engine/player.js';
import { generateStartingGear, addItemToInventory } from './systems/inventory/index.js';
import { loadAssets, debugAssets } from './systems/assetLoader.js';

window.player = player;
window.gameState = { showInventory: false };

export async function startGame() {
  try {
    initDebugger();
    debug('📦 Инициализация игры...');

    const canvas = document.getElementById('gameCanvas');
    if (!canvas) throw new Error('Canvas не найден!');
    const ctx = canvas.getContext('2d');

    setupInput(canvas);
    debug('🎮 Управление готово');

    debug('⏳ Загружаем ассеты...');
    await loadAssets();
    debug('✅ Ассеты загружены');

    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) loadingScreen.style.display = 'none';

    debugAssets();

    const startingItems = generateStartingGear();
    for (const item of startingItems) {
      const result = addItemToInventory(player.inventory, item);
      if (result) debug(`🎒 Добавлен предмет: ${item.name}`);
    }

    window.gameState.scene = 'map';
    debug('🗺️ Сцена установлена: map');

    function gameLoop() {
      try {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        update(player);
        draw(ctx, player);
        requestAnimationFrame(gameLoop);
      } catch (err) {
        debug(`💥 Ошибка в gameLoop: ${err.message}`, 'error');
      }
    }

    debug('🚀 Запускаем игровой цикл...');
    gameLoop();

    // ❗ Отключаем логирование после запуска
    toggleDebug(false);

  } catch (error) {
    debug(`❌ Критическая ошибка: ${error.message}`, 'error');
    const debuggerDiv = document.getElementById('debugger');
    if (debuggerDiv) {
      debuggerDiv.innerHTML += `\n<span style="color: red;">Критическая ошибка: ${error.message}</span>`;
    }
  }
}
