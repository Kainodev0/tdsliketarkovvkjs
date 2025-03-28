/**
 * Система контейнеров (ящики, сейфы, рюкзаки) для лута
 */

import { debug } from '../../engine/debugger.js';
import { generateLoot, generateMixedLoot } from './loot.js';
import { createInventory, addItemToInventory } from './inventory.js';

// Типы контейнеров и их свойства
export const containerTypes = {
  crate: {
    name: 'Ящик',
    lootTable: 'common',
    itemsCount: { min: 1, max: 3 },
    sprite: 'crate',
    size: { width: 40, height: 40 },
    openable: true
  },
  safe: {
    name: 'Сейф',
    lootTable: 'rare',
    itemsCount: { min: 2, max: 4 },
    sprite: 'safe',
    size: { width: 30, height: 40 },
    openable: true,
    locked: true
  },
  backpack: {
    name: 'Рюкзак',
    lootTable: 'uncommon',
    itemsCount: { min: 2, max: 5 },
    sprite: 'backpack',
    size: { width: 30, height: 30 },
    openable: true
  },
  deadBody: {
    name: 'Труп',
    lootTable: 'mixed',
    itemsCount: { min: 3, max: 7 },
    sprite: 'dead_body',
    size: { width: 40, height: 60 },
    openable: true
  }
};

/**
 * Создает контейнер с лутом
 * @param {string} containerType - Тип контейнера (определяет качество лута)
 * @param {number} x - X координата контейнера на карте
 * @param {number} y - Y координата контейнера на карте
 * @returns {Object} - Объект контейнера
 */
export function createContainer(containerType, x, y) {
  // Если указанный тип не существует, используем crate
  const type = containerTypes[containerType] || containerTypes.crate;
  
  // Генерируем случайное количество предметов
  const itemsCount = Math.floor(Math.random() * (type.itemsCount.max - type.itemsCount.min + 1)) + type.itemsCount.min;
  
  // Создаем контейнер с пустым инвентарем
  const container = {
    id: generateContainerId(),
    type: containerType,
    name: type.name,
    x,
    y,
    width: type.size.width,
    height: type.size.height,
    sprite: type.sprite,
    openable: type.openable,
    locked: type.locked || false,
    opened: false,
    inventory: createInventory(5, 5), // Инвентарь контейнера меньше, чем у игрока
    
    // Методы контейнера
    open() {
      if (!this.openable || this.opened) return false;
      if (this.locked) {
        debug(`${this.name} заперт. Требуется ключ.`);
        return false;
      }
      
      this.opened = true;
      debug(`${this.name} открыт`);
      return true;
    },
    
    unlock() {
      if (!this.locked) return true;
      this.locked = false;
      debug(`${this.name} разблокирован`);
      return true;
    }
  };
  
  // Заполняем контейнер предметами
  populateContainer(container, type.lootTable, itemsCount);
  
  return container;
}

/**
 * Заполняет контейнер предметами
 * @param {Object} container - Объект контейнера
 * @param {string} lootTable - Таблица лута
 * @param {number} itemsCount - Количество предметов
 */
function populateContainer(container, lootTable, itemsCount) {
  let loot;
  
  if (lootTable === 'mixed') {
    // Для смешанного типа используем различные таблицы с разными шансами
    loot = generateMixedLoot(0.7, 0.25, 0.05, itemsCount);
  } else {
    // Для обычного типа используем одну таблицу
    loot = generateLoot(lootTable, itemsCount);
  }
  
  // Добавляем предметы в инвентарь контейнера
  for (const item of loot) {
    addItemToInventory(container.inventory, item);
  }
}

/**
 * Генерирует уникальный ID для контейнера
 * @returns {string} - Уникальный идентификатор
 */
function generateContainerId() {
  return 'container_' + Math.random().toString(36).substring(2, 15);
}

/**
 * Отрисовывает контейнер на карте
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {Object} container - Объект контейнера
 */
export function drawContainer(ctx, container) {
  // Рисуем простой прямоугольник для контейнера
  ctx.fillStyle = container.opened ? '#7a5230' : '#8b4513';
  ctx.fillRect(container.x, container.y, container.width, container.height);
  
  // Если контейнер заперт, добавляем индикатор замка
  if (container.locked) {
    ctx.fillStyle = '#888';
    ctx.beginPath();
    ctx.arc(container.x + container.width / 2, container.y + container.height / 2, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Если у нас есть спрайт, рисуем его вместо прямоугольника
  // if (container.sprite && assets.images[container.sprite]) {
  //   ctx.drawImage(assets.images[container.sprite], container.x, container.y, container.width, container.height);
  // }
}

/**
 * Проверяет, находится ли точка внутри контейнера
 * @param {Object} container - Объект контейнера
 * @param {number} x - X координата
 * @param {number} y - Y координата
 * @returns {boolean} - Находится ли точка внутри контейнера
 */
export function isPointInContainer(container, x, y) {
  return x >= container.x && x <= container.x + container.width &&
         y >= container.y && y <= container.y + container.height;
}