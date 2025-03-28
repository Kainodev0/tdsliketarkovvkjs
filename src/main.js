import { setupInput } from './engine/input.js';
import { update } from './engine/update.js';
import { draw } from './render/draw.js';
import { debug, initDebugger } from './engine/debugger.js';
import { player } from './engine/player.js';

window.player = player;

export function startGame() {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  initDebugger();
  setupInput(canvas);
  debug('Game initialized.');

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
}
