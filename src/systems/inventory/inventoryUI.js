/**
 * Отрисовка и UI взаимодействие с инвентарем
 */

import { getItemColor } from './itemTypes.js';
import { getItemAtPosition } from './inventory.js';

// Состояние UI инвентаря
export const inventoryUIState = {
  isOpen: false,
  draggedItem: null,
  selectedItemId: null,
  hoveredItemId: null,
  contextMenuOpen: false,
  contextMenuPosition: { x: 0, y: 0 },
  contextMenuItemId: null
};

/**
 * Отрисовывает инвентарь
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {Object} inventory - Объект инвентаря
 * @param {Object} [options] - Опции отрисовки
 */
export function drawInventory(ctx, inventory, options = {}) {
  const {
    x = 50,
    y = 50,
    cellSize = 40,
    padding = 5,
    backgroundColor = 'rgba(0, 0, 0, 0.7)',
    gridColor = 'rgba(255, 255, 255, 0.3)'
  } = options;
  
  // Рисуем фон инвентаря
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(
    x, y, 
    inventory.width * cellSize + padding * 2, 
    inventory.height * cellSize + padding * 2
  );
  
  // Рисуем сетку
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  
  for (let i = 0; i <= inventory.width; i++) {
    ctx.beginPath();
    ctx.moveTo(x + padding + i * cellSize, y + padding);
    ctx.lineTo(x + padding + i * cellSize, y + padding + inventory.height * cellSize);
    ctx.stroke();
  }
  
  for (let i = 0; i <= inventory.height; i++) {
    ctx.beginPath();
    ctx.moveTo(x + padding, y + padding + i * cellSize);
    ctx.lineTo(x + padding + inventory.width * cellSize, y + padding + i * cellSize);
    ctx.stroke();
  }
  
  // Рисуем предметы
  for (const { item, position, rotation } of inventory.items) {
    const itemWidth = rotation === 0 ? item.size.width : item.size.height;
    const itemHeight = rotation === 0 ? item.size.height : item.size.width;
    
    const itemX = x + padding + position.x * cellSize;
    const itemY = y + padding + position.y * cellSize;
    
    // Подсветка выбранного предмета
    if (inventoryUIState.selectedItemId && item.id === inventoryUIState.selectedItemId) {
      ctx.fillStyle = 'rgba(100, 149, 237, 0.5)'; // светло-синий
      ctx.fillRect(itemX, itemY, itemWidth * cellSize, itemHeight * cellSize);
    }
    
    // Подсветка предмета под курсором
    if (inventoryUIState.hoveredItemId && item.id === inventoryUIState.hoveredItemId) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(itemX, itemY, itemWidth * cellSize, itemHeight * cellSize);
    }
    
    // Фон предмета
    ctx.fillStyle = getItemColor(item.type);
    ctx.fillRect(itemX, itemY, itemWidth * cellSize, itemHeight * cellSize);
    
    // Рамка предмета
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(itemX, itemY, itemWidth * cellSize, itemHeight * cellSize);
    
    // Рисуем имя предмета (временно, пока не добавим спрайты)
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      item.name,
      itemX + itemWidth * cellSize / 2,
      itemY + itemHeight * cellSize / 2
    );
    
    // Отображаем количество для стакающихся предметов
    if (item.stackable && item.quantity > 1) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(
        itemX + itemWidth * cellSize - 25,
        itemY + itemHeight * cellSize - 20,
        25, 20
      );
      
      ctx.fillStyle = '#fff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        item.quantity.toString(),
        itemX + itemWidth * cellSize - 12,
        itemY + itemHeight * cellSize - 10
      );
    }
  }
  
  // Отображаем информацию о весе внизу инвентаря
  ctx.fillStyle = '#fff';
  ctx.font = '14px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(
    `Вес: ${inventory.weight.toFixed(1)} / ${inventory.maxWeight}`,
    x + padding,
    y + padding + inventory.height * cellSize + 10
  );
  
  // Рисуем контекстное меню, если оно открыто
  if (inventoryUIState.contextMenuOpen) {
    drawContextMenu(ctx, inventoryUIState.contextMenuPosition);
  }
  
  // Рисуем перетаскиваемый предмет, если есть
  if (inventoryUIState.draggedItem) {
    drawDraggedItem(ctx);
  }
}

/**
 * Рисует контекстное меню
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {Object} position - Позиция меню {x, y}
 */
function drawContextMenu(ctx, position) {
  const menuWidth = 120;
  const menuItemHeight = 30;
  const menuItems = ['Использовать', 'Выбросить', 'Отмена'];
  const menuHeight = menuItems.length * menuItemHeight;
  
  // Фон меню
  ctx.fillStyle = 'rgba(40, 40, 40, 0.95)';
  ctx.fillRect(position.x, position.y, menuWidth, menuHeight);
  
  // Рамка меню
  ctx.strokeStyle = 'rgba(200, 200, 200, 0.8)';
  ctx.lineWidth = 1;
  ctx.strokeRect(position.x, position.y, menuWidth, menuHeight);
  
  // Пункты меню
  ctx.fillStyle = '#fff';
  ctx.font = '14px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  
  for (let i = 0; i < menuItems.length; i++) {
    ctx.fillText(
      menuItems[i],
      position.x + 10,
      position.y + i * menuItemHeight + menuItemHeight / 2
    );
  }
}

/**
 * Рисует перетаскиваемый предмет
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 */
function drawDraggedItem(ctx) {
  const { item, mouseX, mouseY } = inventoryUIState.draggedItem;
  const cellSize = 40; // Размер ячейки
  
  // Рисуем предмет под курсором
  const itemWidth = item.size.width * cellSize;
  const itemHeight = item.size.height * cellSize;
  
  // Центрируем предмет относительно курсора
  const itemX = mouseX - itemWidth / 2;
  const itemY = mouseY - itemHeight / 2;
  
  // Полупрозрачный фон предмета
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = getItemColor(item.type);
  ctx.fillRect(itemX, itemY, itemWidth, itemHeight);
  
  // Рамка предмета
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.lineWidth = 2;
  ctx.strokeRect(itemX, itemY, itemWidth, itemHeight);
  
  // Рисуем имя предмета
  ctx.fillStyle = '#fff';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    item.name,
    itemX + itemWidth / 2,
    itemY + itemHeight / 2
  );
  
  // Восстанавливаем прозрачность
  ctx.globalAlpha = 1.0;
}

/**
 * Обработчик нажатия мыши для инвентаря
 * @param {Object} inventory - Объект инвентаря
 * @param {number} mouseX - X координата мыши
 * @param {number} mouseY - Y координата мыши
 * @param {Object} [options] - Опции (такие же, как для drawInventory)
 * @returns {boolean} - Был ли клик обработан инвентарем
 */
export function handleInventoryClick(inventory, mouseX, mouseY, options = {}) {
  // Если открыто контекстное меню, обрабатываем клик в нем
  if (inventoryUIState.contextMenuOpen) {
    const menuHandled = handleContextMenuClick(mouseX, mouseY);
    if (menuHandled) return true;
    
    // Если клик был вне меню, закрываем его
    inventoryUIState.contextMenuOpen = false;
    return true;
  }
  
  // Находим предмет под курсором
  const clickedItem = getItemAtPosition(inventory, mouseX, mouseY, options);
  
  if (clickedItem) {
    // Обрабатываем клик по предмету
    inventoryUIState.selectedItemId = clickedItem.item.id;
    return true;
  } else {
    // Клик по пустой области
    inventoryUIState.selectedItemId = null;
    return true;
  }
}

/**
 * Обработчик правого клика мыши для открытия контекстного меню
 * @param {Object} inventory - Объект инвентаря
 * @param {number} mouseX - X координата мыши
 * @param {number} mouseY - Y координата мыши
 * @param {Object} [options] - Опции (такие же, как для drawInventory)
 * @returns {boolean} - Был ли клик обработан
 */
export function handleInventoryRightClick(inventory, mouseX, mouseY, options = {}) {
  // Находим предмет под курсором
  const clickedItem = getItemAtPosition(inventory, mouseX, mouseY, options);
  
  if (clickedItem) {
    // Открываем контекстное меню для предмета
    inventoryUIState.contextMenuOpen = true;
    inventoryUIState.contextMenuPosition = { x: mouseX, y: mouseY };
    inventoryUIState.contextMenuItemId = clickedItem.item.id;
    inventoryUIState.selectedItemId = clickedItem.item.id;
    return true;
  }
  
  return false;
}

/**
 * Обработчик клика по контекстному меню
 * @param {number} mouseX - X координата мыши
 * @param {number} mouseY - Y координата мыши
 * @returns {boolean} - Был ли клик обработан
 */
function handleContextMenuClick(mouseX, mouseY) {
  if (!inventoryUIState.contextMenuOpen) return false;
  
  const { x, y } = inventoryUIState.contextMenuPosition;
  const menuWidth = 120;
  const menuItemHeight = 30;
  const menuItems = ['Использовать', 'Выбросить', 'Отмена'];
  const menuHeight = menuItems.length * menuItemHeight;
  
  // Проверяем, находится ли клик внутри меню
  if (mouseX >= x && mouseX <= x + menuWidth &&
      mouseY >= y && mouseY <= y + menuHeight) {
      
    // Определяем, на какой пункт меню был клик
    const itemIndex = Math.floor((mouseY - y) / menuItemHeight);
    
    if (itemIndex >= 0 && itemIndex < menuItems.length) {
      // Обрабатываем выбор пункта меню
      const selectedAction = menuItems[itemIndex];
      const itemId = inventoryUIState.contextMenuItemId;
      
      // TODO: Выполнить действие с предметом
      console.log(`Action "${selectedAction}" for item ID: ${itemId}`);
      
      // Закрываем контекстное меню
      inventoryUIState.contextMenuOpen = false;
      return true;
    }
  }
  
  return false;
}