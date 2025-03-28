export const keys = {};

export function setupInput(canvas) {
  document.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
  document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const player = window.player;
    if (player) {
      player.angle = Math.atan2(mouseY - player.y, mouseX - player.x);
    }
  });
}
