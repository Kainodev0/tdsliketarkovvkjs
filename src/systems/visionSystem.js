export function getVisibleTiles(player, map, viewDistance = 200) {
    const visible = [];
    const step = 5;
    const angles = 360;
  
    for (let a = 0; a < angles; a += 1) {
      const angle = (a * Math.PI) / 180;
      let x = player.x;
      let y = player.y;
  
      for (let d = 0; d < viewDistance; d += step) {
        x += Math.cos(angle) * step;
        y += Math.sin(angle) * step;
  
        visible.push({ x, y });
  
        for (const wall of map.walls) {
          if (
            x > wall.x &&
            x < wall.x + wall.w &&
            y > wall.y &&
            y < wall.y + wall.h
          ) {
            d = viewDistance;
            break;
          }
        }
      }
    }
  
    return visible;
  }
  
  export function drawFog(ctx, visiblePoints) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    visiblePoints.forEach(p => {
      ctx.moveTo(p.x, p.y);
      ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
    });
    ctx.fill();
    ctx.restore();
  }
  