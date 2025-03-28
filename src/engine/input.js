export const keys = {};
export const mouse = { x: 0, y: 0 }; // Глобальная позиция мыши в мировых координатах

export function setupInput(canvas) {
  document.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;

    // Открываем/закрываем инвентарь по клавише Tab
    if (e.key === 'Tab') {
      e.preventDefault();
      if (window.gameState) {
        window.gameState.showInventory = !window.gameState.showInventory;
      }
    }
  });

  document.addEventListener('keyup', e => {
    keys[e.key.toLowerCase()] = false;
  });

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();

    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    // Центр канваса (экранные координаты)
    const canvasCenterX = canvas.width / 2;
    const canvasCenterY = canvas.height / 2;

    const player = window.player;
    if (player) {
      // Учёт смещения камеры
      mouse.x = player.x + (screenX - canvasCenterX);
      mouse.y = player.y + (screenY - canvasCenterY);

      // Обновляем угол поворота
      player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
    }
  });
}
