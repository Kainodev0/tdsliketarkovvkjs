import { setupInput } from './engine/input.js';
import { update } from './engine/update.js';
import { draw } from './render/draw.js';
import { debug, initDebugger } from './engine/debugger.js';
import { player } from './engine/player.js';
import { generateStartingGear, addItemToInventory } from './systems/inventory/index.js';
import { loadAssets, debugAssets } from './systems/assetLoader.js';

window.player = player;
window.gameState = { showInventory: false };

export async function startGame() {
  try {
    // Инициализируем отладчик как можно раньше
    initDebugger();
    debug('Game initialization started...');

    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
      throw new Error('Canvas не найден!');
    }
    const ctx = canvas.getContext('2d');

    // Настройка ввода
    setupInput(canvas);
    debug('Input setup complete.');

    // Загрузка ассетов
    debug('Starting asset loading...');
    const loadedAssets = await loadAssets();
    debug('Assets loading completed.');

    // Отладочная информация об ассетах
    debugAssets();

    // Добавляем начальные предметы в инвентарь игрока
    const startingItems = generateStartingGear();
    for (const item of startingItems) {
      const result = addItemToInventory(player.inventory, item);
      debug(`Added starting item ${item.name}: ${result}`);
    }

    // Основной игровой цикл
    function gameLoop() {
      try {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        update(player);
        draw(ctx, player);
        requestAnimationFrame(gameLoop);
      } catch (err) {
        debug(`Game loop error: ${err.message}`, 'error');
      }
    }

    // Запуск игрового цикла
    debug('Starting game loop...');
    gameLoop();

  } catch (error) {
    debug(`Critical game initialization error: ${error.message}`, 'error');
    // Можно добавить визуальное оповещение пользователя
    const debuggerDiv = document.getElementById('debugger');
    if (debuggerDiv) {
      debuggerDiv.innerHTML += `\n<span style="color: red;">Критическая ошибка: ${error.message}</span>`;
    }
  }
}