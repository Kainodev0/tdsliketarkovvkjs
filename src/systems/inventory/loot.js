/**
 * Функции для генерации лута и управления системой добычи
 */

import { debug } from '../../engine/debugger.js';
import { createItem } from './itemCore.js';
import { itemTypes } from './itemTypes.js';

// Таблицы лута по редкости
export const lootTables = {
  common: [
    { itemId: 'ammo_9mm', chance: 0.7, minQuantity: 10, maxQuantity: 30 },
    { itemId: 'bandage', chance: 0.5, minQuantity: 1, maxQuantity: 3 },
    { itemId: 'metal', chance: 0.4, minQuantity: 1, maxQuantity: 5 }
  ],
  uncommon: [
    { itemId: 'pistol', chance: 0.2, minQuantity: 1, maxQuantity: 1 },
    { itemId: 'medkit', chance: 0.3, minQuantity: 1, maxQuantity: 1 },
    { itemId: 'ammo_12gauge', chance: 0.4, minQuantity: 8, maxQuantity: 15 }
  ],
  rare: [
    { itemId: 'shotgun', chance: 0.15, minQuantity: 1, maxQuantity: 1 },
    { itemId: 'bodyArmor', chance: 0.1, minQuantity: 1, maxQuantity: 1 },
    { itemId: 'goldwatch', chance: 0.3, minQuantity: 1, maxQuantity: 1 }
  ]
};

/**
 * Создает случайный лут на основе таблицы лута
 * @param {string} lootTableId - ID таблицы лута ('common', 'rare', etc.)
 * @param {number} [count=0] - Минимальное количество предметов (0 = случайное)
 * @returns {Array} - Массив созданных предметов
 */
export function generateLoot(lootTableId = 'common', count = 0) {
  // Если указанная таблица не существует, используем common
  const table = lootTables[lootTableId] || lootTables.common;
  
  // Генерируем предметы
  const loot = [];
  
  // Обеспечиваем минимальное количество предметов, если указано
  let attemptsLeft = count > 0 ? Math.min(count * 3, table.length * 3) : table.length;
  
  while (loot.length < count || (count === 0 && attemptsLeft > 0)) {
    // Выбираем случайную запись из таблицы
    const randomIndex = Math.floor(Math.random() * table.length);
    const entry = table[randomIndex];
    
    // Проверяем, выпадает ли предмет по шансу
    if (Math.random() <= entry.chance) {
      // Определяем случайное количество
      const quantity = entry.minQuantity === entry.maxQuantity ? 
        entry.minQuantity : 
        Math.floor(Math.random() * (entry.maxQuantity - entry.minQuantity + 1)) + entry.minQuantity;
      
      // Создаем предмет
      const item = createItem(entry.itemId, quantity);
      if (item) {
        loot.push(item);
      }
    }
    
    attemptsLeft--;
    
    // Если достигли минимального количества предметов или исчерпали попытки
    if ((count > 0 && loot.length >= count) || attemptsLeft <= 0) {
      break;
    }
  }
  
  return loot;
}

/**
 * Создает лут с распределением по редкости
 * @param {number} commonChance - Шанс выпадения обычного предмета (0-1)
 * @param {number} uncommonChance - Шанс выпадения необычного предмета (0-1)
 * @param {number} rareChance - Шанс выпадения редкого предмета (0-1)
 * @param {number} totalItems - Общее количество предметов
 * @returns {Array} - Массив созданных предметов
 */
export function generateMixedLoot(commonChance = 0.7, uncommonChance = 0.25, rareChance = 0.05, totalItems = 3) {
  const loot = [];
  
  for (let i = 0; i < totalItems; i++) {
    const roll = Math.random();
    let table;
    
    if (roll < rareChance) {
      table = 'rare';
    } else if (roll < rareChance + uncommonChance) {
      table = 'uncommon';
    } else {
      table = 'common';
    }
    
    const items = generateLoot(table, 1);
    loot.push(...items);
  }
  
  return loot;
}

/**
 * Генерирует начальный лут для игрока
 * @returns {Array} - Массив предметов для начального снаряжения
 */
export function generateStartingGear() {
  const gear = [];
  
  // Пистолет
  gear.push(createItem('pistol'));
  
  // Два магазина патронов
  gear.push(createItem('ammo_9mm', 30));
  gear.push(createItem('ammo_9mm', 30));
  
  // Аптечка
  gear.push(createItem('medkit'));
  
  // Пара бинтов
  gear.push(createItem('bandage', 2));
  
  return gear;
}