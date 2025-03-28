/**
 * Основные функции для работы с предметами
 */

import { debug } from '../../engine/debugger.js';
import { itemTypes } from './itemTypes.js';
import { createWeapon } from '../weaponSystem.js';

/**
 * Создает новый предмет указанного типа
 * @param {string} itemId - Идентификатор типа предмета
 * @param {number} [quantity=1] - Количество для стопки предметов
 * @returns {Object} - Объект предмета
 */
export function createItem(itemId, quantity = 1) {
  if (!itemTypes[itemId]) {
    debug(`Неизвестный тип предмета: ${itemId}`, 'error');
    return null;
  }
  
  const itemType = itemTypes[itemId];
  
  // Базовые свойства предмета
  const item = {
    id: generateItemId(), // Уникальный ID для этого экземпляра предмета
    itemId,
    name: itemType.name,
    type: itemType.type,
    description: itemType.description,
    weight: itemType.weight,
    size: { ...itemType.size },
    value: itemType.value,
    sprite: itemType.sprite,
    stackable: itemType.stackable,
    quantity: itemType.stackable ? Math.min(quantity, itemType.maxStack) : 1
  };
  
  // Добавляем специфические свойства в зависимости от типа предмета
  switch (itemType.type) {
    case 'weapon':
      item.weaponType = itemType.weaponType;
      break;
      
    case 'ammo':
      item.ammoType = itemType.ammoType;
      item.ammoCount = itemType.ammoCount;
      break;
      
    case 'medical':
      item.healAmount = itemType.healAmount;
      item.useTime = itemType.useTime;
      break;
      
    case 'armor':
      item.protection = itemType.protection;
      item.durability = itemType.durability;
      break;
  }
  
  return item;
}

/**
 * Генерирует уникальный ID для предмета
 * @returns {string} - Уникальный идентификатор
 */
function generateItemId() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Использует предмет
 * @param {Object} player - Объект игрока
 * @param {Object} item - Предмет для использования
 * @returns {boolean} - Успешно ли использован предмет
 */
export function useItem(player, item) {
  if (!item) return false;
  
  // Обрабатываем разные типы предметов
  switch (item.type) {
    case 'weapon':
      // Экипируем оружие
      if (player.weapon && player.weapon.id === item.id) {
        debug('Это оружие уже экипировано');
        return false;
      }
      
      // Создаем оружие для игрока
      player.weapon = createWeapon(item.weaponType);
      player.weapon.id = item.id; // Связываем с ID предмета
      
      debug(`Экипировано оружие: ${item.name}`);
      return true;
      
    case 'medical':
      // Применяем лечение
      if (!player.health || player.health >= 100) {
        debug('Игрок не нуждается в лечении');
        return false;
      }
      
      // Увеличиваем здоровье игрока
      player.health = Math.min(100, player.health + item.healAmount);
      
      debug(`Использован медицинский предмет. Здоровье игрока: ${player.health}`);
      return true;
      
    case 'armor':
      // Экипируем броню
      if (player.armor && player.armor.id === item.id) {
        debug('Эта броня уже экипирована');
        return false;
      }
      
      player.armor = {
        id: item.id,
        protection: item.protection,
        durability: item.durability
      };
      
      debug(`Экипирована броня: ${item.name}`);
      return true;
      
    default:
      debug(`Предмет типа ${item.type} нельзя использовать напрямую`);
      return false;
  }
}

/**
 * Проверяет, можно ли стакать два предмета
 * @param {Object} item1 - Первый предмет
 * @param {Object} item2 - Второй предмет
 * @returns {boolean} - Можно ли стакать предметы
 */
export function canStackItems(item1, item2) {
  if (!item1 || !item2) return false;
  if (!item1.stackable || !item2.stackable) return false;
  if (item1.itemId !== item2.itemId) return false;
  
  return true;
}

/**
 * Стакает два предмета вместе
 * @param {Object} targetItem - Предмет, в который стакаем
 * @param {Object} sourceItem - Предмет, который стакаем
 * @returns {number} - Количество оставшихся предметов в sourceItem (0 если все перенесены)
 */
export function stackItems(targetItem, sourceItem) {
  if (!canStackItems(targetItem, sourceItem)) {
    return sourceItem.quantity;
  }
  
  const maxStack = itemTypes[targetItem.itemId].maxStack;
  const spaceLeft = maxStack - targetItem.quantity;
  
  if (spaceLeft >= sourceItem.quantity) {
    // Всё влезает в стак
    targetItem.quantity += sourceItem.quantity;
    return 0;
  } else {
    // Частично влезает
    targetItem.quantity = maxStack;
    sourceItem.quantity -= spaceLeft;
    return sourceItem.quantity;
  }
}