/**
 * Основные функции инвентаря
 */

import { debug } from '../../engine/debugger.js';
import { itemTypes } from './itemTypes.js';
import { createItem, useItem } from './itemCore.js';

/**
 * Создает инвентарь с указанным размером
 * @param {number} width - Ширина инвентаря в ячейках
 * @param {number} height - Высота инвентаря в ячейках
 * @returns {Object} - Объект инвентаря
 */
export function createInventory(width = 10, height = 10) {
  return {
    width,
    height,
    items: [], // Список предметов в инвентаре с их позициями
    weight: 0, // Текущий вес инвентаря
    maxWeight: 40 // Максимальный вес, который можно нести
  };
}

/**
 * Добавляет предмет в инвентарь
 * @param {Object} inventory - Объект инвентаря
 * @param {Object} item - Предмет для добавления
 * @returns {boolean} - Успешно ли добавлен предмет
 */
export function addItemToInventory(inventory, item) {
  // Проверяем, можно ли стакать предмет с существующими
  if (item.stackable) {
    const existingItem = inventory.items.find(i => 
      i.item.itemId === item.itemId && i.item.quantity < itemTypes[item.itemId].maxStack
    );
    
    if (existingItem) {
      const maxStack = itemTypes[item.itemId].maxStack;
      const spaceInStack = maxStack - existingItem.item.quantity;
      
      if (spaceInStack >= item.quantity) {
        // Весь стек помещается в существующий
        existingItem.item.quantity += item.quantity;
        inventory.weight += item.weight * item.quantity;
        debug(`Добавлено ${item.quantity} ${item.name} в существующий стак`);
        return true;
      } else {
        // Часть стека помещается, создаем новый для остатка
        existingItem.item.quantity = maxStack;
        item.quantity -= spaceInStack;
        inventory.weight += item.weight * spaceInStack;
        // Продолжаем и пытаемся разместить остаток как новый предмет
      }
    }
  }
  
  // Проверяем, не превысит ли новый предмет максимальный вес
  const addedWeight = item.weight * item.quantity;
  if (inventory.weight + addedWeight > inventory.maxWeight) {
    debug(`Недостаточно места в инвентаре. Текущий вес: ${inventory.weight.toFixed(1)}/${inventory.maxWeight}`, 'error');
    return false;
  }
  
  // Ищем свободное место в инвентаре
  const position = findFreeSpaceInInventory(inventory, item.size.width, item.size.height);
  
  if (position) {
    // Добавляем предмет в инвентарь
    inventory.items.push({
      item,
      position,
      rotation: 0 // 0 - нормальное положение, 1 - повернуто на 90 градусов
    });
    
    // Обновляем вес инвентаря
    inventory.weight += addedWeight;
    
    debug(`Предмет ${item.name} добавлен в инвентарь на позицию [${position.x}, ${position.y}]`);
    return true;
  } else {
    debug(`Недостаточно места в инвентаре для размещения предмета ${item.name}`, 'error');
    return false;
  }
}

/**
 * Ищет свободное место в инвентаре для предмета указанного размера
 * @param {Object} inventory - Объект инвентаря
 * @param {number} width - Ширина предмета
 * @param {number} height - Высота предмета
 * @returns {Object|null} - Позиция {x, y} или null, если места нет
 */
function findFreeSpaceInInventory(inventory, width, height) {
  // Создаем карту занятых ячеек
  const occupiedCells = Array(inventory.height).fill().map(() => Array(inventory.width).fill(false));
  
  // Отмечаем занятые ячейки
  for (const { item, position, rotation } of inventory.items) {
    const itemWidth = rotation === 0 ? item.size.width : item.size.height;
    const itemHeight = rotation === 0 ? item.size.height : item.size.width;
    
    for (let y = position.y; y < position.y + itemHeight; y++) {
      for (let x = position.x; x < position.x + itemWidth; x++) {
        if (y < inventory.height && x < inventory.width) {
          occupiedCells[y][x] = true;
        }
      }
    }
  }
  
  // Ищем свободное место
  for (let y = 0; y <= inventory.height - height; y++) {
    for (let x = 0; x <= inventory.width - width; x++) {
      let isFree = true;
      
      // Проверяем прямоугольник на свободные ячейки
      for (let dy = 0; dy < height; dy++) {
        for (let dx = 0; dx < width; dx++) {
          if (occupiedCells[y + dy][x + dx]) {
            isFree = false;
            break;
          }
        }
        if (!isFree) break;
      }
      
      if (isFree) {
        return { x, y };
      }
    }
  }
  
  // Пробуем перевернуть предмет, если ширина и высота отличаются
  if (width !== height) {
    return findFreeSpaceInInventory(inventory, height, width);
  }
  
  return null; // Не нашли места
}

/**
 * Удаляет предмет из инвентаря
 * @param {Object} inventory - Объект инвентаря
 * @param {string} itemId - Уникальный ID предмета для удаления
 * @param {number} [quantity=1] - Количество предметов для удаления из стопки
 * @returns {Object|null} - Удаленный предмет или null
 */
export function removeItemFromInventory(inventory, itemId, quantity = 1) {
  const itemIndex = inventory.items.findIndex(i => i.item.id === itemId);
  
  if (itemIndex === -1) {
    debug(`Предмет с ID ${itemId} не найден в инвентаре`, 'error');
    return null;
  }
  
  const inventoryItem = inventory.items[itemIndex];
  const item = inventoryItem.item;
  
  // Если предмет стакается
  if (item.stackable && item.quantity > quantity) {
    // Уменьшаем количество в стопке
    item.quantity -= quantity;
    inventory.weight -= item.weight * quantity;
    
    // Создаем копию предмета для возврата
    const removedItem = createItem(item.itemId, quantity);
    
    debug(`Удалено ${quantity} ${item.name} из инвентаря, осталось ${item.quantity}`);
    return removedItem;
  } else {
    // Удаляем предмет полностью
    inventory.items.splice(itemIndex, 1);
    inventory.weight -= item.weight * item.quantity;
    
    debug(`Предмет ${item.name} полностью удален из инвентаря`);
    return item;
  }
}

/**
 * Использует предмет из инвентаря
 * @param {Object} inventory - Объект инвентаря
 * @param {Object} player - Объект игрока
 * @param {string} itemId - Уникальный ID предмета
 * @returns {boolean} - Успешно ли использован предмет
 */
export function useItemFromInventory(inventory, player, itemId) {
  const inventoryItemIndex = inventory.items.findIndex(i => i.item.id === itemId);
  
  if (inventoryItemIndex === -1) {
    debug(`Предмет с ID ${itemId} не найден в инвентаре`, 'error');
    return false;
  }
  
  const inventoryItem = inventory.items[inventoryItemIndex];
  const result = useItem(player, inventoryItem.item);
  
  // Если это расходуемый предмет, удаляем его из инвентаря
  if (result && 
     (inventoryItem.item.type === 'medical' || 
      inventoryItem.item.type === 'food')) {
    removeItemFromInventory(inventory, itemId, 1);
  }
  
  return result;
}

/**
 * Находит предмет в инвентаре по координатам экрана
 * @param {Object} inventory - Объект инвентаря
 * @param {number} screenX - X координата на экране
 * @param {number} screenY - Y координата на экране
 * @param {Object} [options] - Опции (такие же, как для drawInventory)
 * @returns {Object|null} - Найденный предмет и его позиция или null
 */
export function getItemAtPosition(inventory, screenX, screenY, options = {}) {
  const {
    x = 50,
    y = 50,
    cellSize = 40,
    padding = 5
  } = options;
  
  // Проверяем, входят ли координаты в область инвентаря
  const inventoryLeft = x + padding;
  const inventoryTop = y + padding;
  const inventoryRight = inventoryLeft + inventory.width * cellSize;
  const inventoryBottom = inventoryTop + inventory.height * cellSize;
  
  if (screenX < inventoryLeft || screenX >= inventoryRight ||
      screenY < inventoryTop || screenY >= inventoryBottom) {
    return null;
  }
  
  // Вычисляем координаты ячейки
  const cellX = Math.floor((screenX - inventoryLeft) / cellSize);
  const cellY = Math.floor((screenY - inventoryTop) / cellSize);
  
  // Ищем предмет, который находится в этой ячейке
  for (const inventoryItem of inventory.items) {
    const { item, position, rotation } = inventoryItem;
    const itemWidth = rotation === 0 ? item.size.width : item.size.height;
    const itemHeight = rotation === 0 ? item.size.height : item.size.width;
    
    if (cellX >= position.x && cellX < position.x + itemWidth &&
        cellY >= position.y && cellY < position.y + itemHeight) {
      return inventoryItem;
    }
  }
  
  return null;
}