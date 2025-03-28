// 📁 src/engine/map.js

// Экспортируем карту по умолчанию (если не используется динамическая загрузка)
export const map = {
  width: 1000,
  height: 700,
  tilesize: 40,
  walls: [
    // Внешняя граница карты
    { x: 50,  y: 50,  w: 880, h: 20 },
    { x: 50,  y: 610, w: 880, h: 20 },
    { x: 50,  y: 50,  w: 20,  h: 560 },
    { x: 930, y: 50,  w: 20,  h: 560 },

    // Левая стена "туннелей" (до B site)
    { x: 300, y: 50,  w: 20,  h: 510 },

    // Правая стена "лонга" (до A site)
    { x: 700, y: 50,  w: 20,  h: 510 }
  ],
  loot: [
    { id: 'crate',     x: 160, y: 80 },   // Точка B
    { id: 'ammo_box',  x: 840, y: 80 }    // Точка A
  ]
};

// Функция отрисовки карты
export function drawMap(ctx) {
  ctx.fillStyle = '#444';
  for (const wall of map.walls) {
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
  }

  for (const item of map.loot) {
    ctx.fillStyle = (item.id === 'medkit') ? '#f00'
                  : (item.id === 'crate') ? '#888'
                  : '#0af';
    ctx.fillRect(item.x - 10, item.y - 10, 20, 20);
  }
}

// Если карта будет загружаться динамически, это переменная будет перезаписываться
export let activeMap = map;

// Позволяет загрузчику установить новую карту
export function setActiveMap(newMap) {
  activeMap = newMap;
}