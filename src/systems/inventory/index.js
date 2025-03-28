/**
 * Модуль инвентаря - точка входа
 * Экспортирует все функции и типы для использования в других модулях
 */

// Импорт и реэкспорт всех компонентов системы инвентаря
export { ItemType, itemTypes, getItemColor } from './itemTypes.js';
export { createItem, useItem, canStackItems, stackItems } from './itemCore.js';
export { 
  createInventory, 
  addItemToInventory, 
  removeItemFromInventory,
  useItemFromInventory,
  getItemAtPosition
} from './inventory.js';
export { generateLoot, generateMixedLoot, generateStartingGear, lootTables } from './loot.js';
export { 
  createContainer, 
  drawContainer, 
  isPointInContainer,
  containerTypes
} from './container.js';
export { 
  drawInventory, 
  handleInventoryClick,
  handleInventoryRightClick,
  inventoryUIState
} from './inventoryUI.js';