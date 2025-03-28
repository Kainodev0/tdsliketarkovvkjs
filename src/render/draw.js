import { drawMap } from '../engine/map.js';

export function draw(ctx, player) {
  ctx.save();

  const offsetX = player.x - ctx.canvas.width / 2;
  const offsetY = player.y - ctx.canvas.height / 2;
  ctx.translate(-offsetX, -offsetY);

  drawMap(ctx);

  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);
  ctx.fillStyle = player.color || '#4af';
  ctx.beginPath();
  ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(player.radius + 10, 0);
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}
