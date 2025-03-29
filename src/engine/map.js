// src/engine/map.js

// Экспортируем карту по умолчанию 
export const map = {
  width: 2000,
  height: 1500,
  tilesize: 40,
  walls: [
    // Внешняя граница карты
    { x: 50,  y: 50,  w: 1900, h: 20, color: '#444' },
    { x: 50,  y: 1430, w: 1900, h: 20, color: '#444' },
    { x: 50,  y: 50,  w: 20,  h: 1380, color: '#444' },
    { x: 1930, y: 50,  w: 20,  h: 1380, color: '#444' },

    // База A (верхний правый угол)
    { x: 1500, y: 100, w: 350, h: 20, color: '#85144b' }, // бордовый
    { x: 1500, y: 100, w: 20, h: 250, color: '#85144b' },
    { x: 1600, y: 350, w: 250, h: 20, color: '#85144b' },
    { x: 1850, y: 150, w: 20, h: 200, color: '#85144b' },
    
    // База B (нижний левый угол)
    { x: 100, y: 1100, w: 300, h: 20, color: '#3D9970' }, // зеленый
    { x: 100, y: 1200, w: 300, h: 20, color: '#3D9970' },
    { x: 400, y: 1100, w: 20, h: 120, color: '#3D9970' },
    
    // Центральное здание (прямоугольник с комнатами)
    { x: 800, y: 600, w: 400, h: 20, color: '#0074D9' }, // синий
    { x: 800, y: 900, w: 400, h: 20, color: '#0074D9' },
    { x: 800, y: 600, w: 20, h: 320, color: '#0074D9' },
    { x: 1200, y: 600, w: 20, h: 320, color: '#0074D9' },
    
    // Внутренние стены центрального здания
    { x: 800, y: 750, w: 150, h: 20, color: '#0074D9' },
    { x: 950, y: 750, w: 20, h: 150, color: '#0074D9' },
    { x: 1050, y: 600, w: 20, h: 150, color: '#0074D9' },
    { x: 1050, y: 750, w: 150, h: 20, color: '#0074D9' },
    
    // Верхний коридор
    { x: 500, y: 300, w: 20, h: 200, color: '#FF851B' }, // оранжевый
    { x: 500, y: 300, w: 600, h: 20, color: '#FF851B' },
    { x: 500, y: 500, w: 600, h: 20, color: '#FF851B' },
    { x: 1100, y: 300, w: 20, h: 220, color: '#FF851B' },
    
    // Препятствия по карте
    { x: 350, y: 200, w: 40, h: 150, color: '#B10DC9' }, // фиолетовый
    { x: 700, y: 1100, w: 150, h: 40, color: '#B10DC9' },
    { x: 1400, y: 700, w: 40, h: 200, color: '#B10DC9' },
    { x: 200, y: 800, w: 100, h: 100, color: '#111111' },
    
    // Случайные препятствия
    { x: 600, y: 800, w: 80, h: 30, color: '#DDDDDD' },
    { x: 1600, y: 500, w: 30, h: 80, color: '#DDDDDD' },
    { x: 400, y: 400, w: 50, h: 50, color: '#DDDDDD' },
    { x: 1200, y: 1200, w: 50, h: 50, color: '#DDDDDD' }
  ],
  loot: [
    // Лут в базе A
    { id: 'crate',     x: 1600, y: 200 },
    { id: 'ammo_box',  x: 1750, y: 250 },
    { id: 'medkit',    x: 1650, y: 300 },
    
    // Лут в базе B
    { id: 'crate',     x: 150, y: 1150 },
    { id: 'medkit',    x: 250, y: 1150 },
    { id: 'ammo_box',  x: 350, y: 1150 },
    
    // Лут в центральном здании
    { id: 'crate',     x: 850, y: 700 },
    { id: 'crate',     x: 1100, y: 650 },
    { id: 'medkit',    x: 850, y: 850 },
    { id: 'ammo_box',  x: 1150, y: 800 },
    
    // Лут в верхнем коридоре
    { id: 'crate',     x: 600, y: 400 },
    { id: 'medkit',    x: 800, y: 400 },
    { id: 'ammo_box',  x: 1000, y: 400 },
    
    // Случайный лут по карте
    { id: 'crate',     x: 300, y: 200 },
    { id: 'medkit',    x: 1500, y: 600 },
    { id: 'ammo_box',  x: 900, y: 1000 },
    { id: 'crate',     x: 500, y: 700 },
    { id: 'ammo_box',  x: 1300, y: 1300 },
    { id: 'medkit',    x: 700, y: 1300 },
    { id: 'crate',     x: 1700, y: 800 }
  ],
  // Добавляем типы местности (для визуального разнообразия)
  terrain: [
    { type: 'grass', x: 50, y: 50, w: 800, h: 800, color: '#7fdb9f' },
    { type: 'dirt', x: 850, y: 50, w: 1100, h: 500, color: '#aa7755' },
    { type: 'concrete', x: 700, y: 550, w: 600, h: 500, color: '#999999' },
    { type: 'water', x: 1300, y: 550, w: 650, h: 400, color: '#7799ff' },
    { type: 'grass', x: 50, y: 850, w: 650, h: 600, color: '#7fdb9f' },
    { type: 'dirt', x: 700, y: 1050, w: 1250, h: 400, color: '#aa7755' }
  ],
  // Добавляем зоны эвакуации
  extractionZones: [
    { x: 1800, y: 200, radius: 60, name: 'Точка A' },
    { x: 200, y: 1350, radius: 60, name: 'Точка B' }
  ]
};

/**
 * Функция отрисовки карты
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 */
export function drawMap(ctx) {
  // 1. Сначала рисуем типы местности (фон)
  if (map.terrain) {
    for (const terrain of map.terrain) {
      ctx.fillStyle = terrain.color || '#333';
      ctx.fillRect(terrain.x, terrain.y, terrain.w, terrain.h);
    }
  } else {
    // Если нет типов местности, рисуем стандартный фон
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, map.width, map.height);
  }
  
  // 2. Рисуем зоны эвакуации
  if (map.extractionZones) {
    for (const zone of map.extractionZones) {
      // Внешний круг
      ctx.beginPath();
      ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(50, 205, 50, 0.2)';
      ctx.fill();
      
      // Граница
      ctx.beginPath();
      ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(50, 205, 50, 0.8)';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Название зоны
      ctx.fillStyle = '#fff';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(zone.name, zone.x, zone.y);
    }
  }
  
  // 3. Рисуем стены и препятствия
  for (const wall of map.walls) {
    ctx.fillStyle = wall.color || '#444';
    
    // Если есть вращение, применяем его
    if (wall.rotation) {
      ctx.save();
      ctx.translate(wall.x + wall.w / 2, wall.y + wall.h / 2);
      ctx.rotate(wall.rotation);
      ctx.fillRect(-wall.w / 2, -wall.h / 2, wall.w, wall.h);
      ctx.restore();
    } else {
      ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    }
  }
  
  // 4. Добавляем декоративные элементы
  // (Деревья, камни и другие объекты для визуального разнообразия)
  drawDecorations(ctx);
}

/**
 * Рисует декоративные элементы на карте
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 */
function drawDecorations(ctx) {
  // Деревья
  const trees = [
    { x: 200, y: 100 },
    { x: 400, y: 150 },
    { x: 600, y: 200 },
    { x: 1500, y: 450 },
    { x: 1700, y: 600 },
    { x: 300, y: 1000 },
    { x: 500, y: 1200 }
  ];
  
  for (const tree of trees) {
    // Ствол
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(tree.x - 5, tree.y - 5, 10, 20);
    
    // Крона
    ctx.fillStyle = '#228B22';
    ctx.beginPath();
    ctx.arc(tree.x, tree.y - 15, 15, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Камни
  const rocks = [
    { x: 100, y: 300, size: 15 },
    { x: 350, y: 700, size: 20 },
    { x: 1200, y: 300, size: 25 },
    { x: 1600, y: 1100, size: 18 },
    { x: 900, y: 1300, size: 22 }
  ];
  
  for (const rock of rocks) {
    ctx.fillStyle = '#777';
    ctx.beginPath();
    ctx.arc(rock.x, rock.y, rock.size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Трава (небольшие пятна на травянистой местности)
  const grassPatches = [
    { x: 150, y: 200 }, { x: 250, y: 300 }, { x: 350, y: 400 },
    { x: 450, y: 500 }, { x: 550, y: 600 }, { x: 650, y: 700 },
    { x: 100, y: 900 }, { x: 200, y: 1000 }, { x: 300, y: 1100 }
  ];
  
  for (const patch of grassPatches) {
    ctx.fillStyle = '#5d9b5d';
    for (let i = 0; i < 5; i++) {
      const offsetX = Math.random() * 20 - 10;
      const offsetY = Math.random() * 20 - 10;
      ctx.fillRect(patch.x + offsetX, patch.y + offsetY, 5, 5);
    }
  }
}

// Позволяет загрузчику установить новую карту
export let activeMap = map;

export function setActiveMap(newMap) {
  activeMap = newMap;
}