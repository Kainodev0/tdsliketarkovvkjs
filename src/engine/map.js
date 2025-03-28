export const map = {
  width: 1600,
  height: 1200,
  tilesize: 40,
  walls: [
    { x: 200, y: 200, w: 200, h: 40 },
    { x: 500, y: 400, w: 40, h: 300 },
    { x: 1000, y: 800, w: 300, h: 40 }
  ]
};

export function drawMap(ctx) {
  ctx.fillStyle = '#333';
  for (const wall of map.walls) {
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
  }
}
