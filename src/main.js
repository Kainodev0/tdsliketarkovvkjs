import { setupInput } from './engine/input.js';
import { update } from './engine/update.js';
import { draw } from './render/draw.js';
import { debug, initDebugger } from './engine/debugger.js';
import { player } from './engine/player.js';
import { generateStartingGear, addItemToInventory } from './systems/inventory/index.js';
import { loadAssets } from './systems/assetLoader.js';

window.player = player;
window.gameState = { showInventory: false };

export async function startGame() {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  initDebugger();
  setupInput(canvas);
  debug('Game initialized.');

  // Загружаем ассеты перед стартом игры
  try {
    await loadAssets();
    debug('Assets loaded successfully');

    // Добавляем начальные предметы в инвентарь игрока
    const startingItems = generateStartingGear();
    for (const item of startingItems) {
      addItemToInventory(player.inventory, item);
    }

    function gameLoop() {
      try {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        update(player);
        draw(ctx, player);
        requestAnimationFrame(gameLoop);
      } catch (err) {
        debug(err.message, 'error');
      }
    }

    gameLoop();
  } catch (error) {
    debug(`Failed to load assets: ${error.message}`, 'error');
  }
}