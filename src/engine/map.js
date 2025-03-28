export const map = {
  width: 1000,
  height: 800,
  tilesize: 40,
  walls: [
    // Внешние стены здания
    { x: 100, y: 100, w: 600, h: 20 }, // верхняя
    { x: 100, y: 480, w: 600, h: 20 }, // нижняя
    { x: 100, y: 120, w: 20, h: 360 }, // левая
    { x: 680, y: 120, w: 20, h: 360 }, // правая

    // Комната 1 (слева сверху)
    { x: 120, y: 120, w: 200, h: 20 }, // верх
    { x: 120, y: 280, w: 20, h: 160 }, // левая
    { x: 300, y: 120, w: 20, h: 160 }, // правая
    { x: 120, y: 260, w: 200, h: 20 }, // низ

    // Комната 2 (справа сверху)
    { x: 340, y: 120, w: 320, h: 20 }, // верх
    { x: 340, y: 260, w: 20, h: 160 }, // левая
    { x: 640, y: 120, w: 20, h: 160 }, // правая
    { x: 340, y: 260, w: 320, h: 20 }, // низ

    // Комната 3 (снизу, разрушенная)
    { x: 120, y: 300, w: 200, h: 20 }, // верх
    { x: 120, y: 300, w: 20, h: 160 }, // левая
    { x: 300, y: 300, w: 20, h: 80 }, // правая половина стены (разрушена)
    { x: 120, y: 440, w: 200, h: 20 }  // низ
  ],

  loot: [
    { id: 'crate', x: 160, y: 160 }, // Комната 1
    { id: 'medkit', x: 380, y: 160 }, // Комната 2
    { id: 'ammo_box', x: 160, y: 360 } // Комната 3 (разрушенная)
  ]
};

export function drawMap(ctx) {
  ctx.fillStyle = '#444';
  for (const wall of map.walls) {
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
  }

  // Отрисовка предметов лута
  for (const item of map.loot) {
    ctx.fillStyle = item.id === 'medkit' ? '#f00' : (item.id === 'crate' ? '#888' : '#0af');
    ctx.fillRect(item.x - 10, item.y - 10, 20, 20);
  }
}