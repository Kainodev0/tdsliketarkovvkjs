// src/engine/input.js
import { debug } from './debugger.js';

// Объект для отслеживания нажатых клавиш
export const keys = {};
export const mouse = { x: 0, y: 0 }; // Глобальная позиция мыши в мировых координатах

/**
 * Настраивает обработчики ввода
 * @param {HTMLCanvasElement} canvas - Элемент canvas для отслеживания мыши
 */
export function setupInput(canvas) {
  // Отладочное сообщение
  debug("Инициализация системы ввода");
  
  // Обработчик нажатия клавиш
  document.addEventListener('keydown', e => {
    // Сохраняем состояние клавиши в нижнем регистре
    keys[e.key.toLowerCase()] = true;
    debug(`Клавиша нажата: ${e.key.toLowerCase()}`);

    // Открываем/закрываем инвентарь по клавише Tab
    if (e.key === 'Tab') {
      e.preventDefault(); // Предотвращаем стандартное поведение Tab
      if (window.gameState) {
        window.gameState.showInventory = !window.gameState.showInventory;
        debug(`Инвентарь ${window.gameState.showInventory ? 'открыт' : 'закрыт'}`);
      }
    }
  });

  // Обработчик отпускания клавиш
  document.addEventListener('keyup', e => {
    keys[e.key.toLowerCase()] = false;
    debug(`Клавиша отпущена: ${e.key.toLowerCase()}`);
  });

  // Проверка, существует ли canvas
  if (!canvas) {
    debug("ОШИБКА: Canvas не найден при инициализации управления", "error");
    return;
  }

  // Обработчик движения мыши
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();

    // Получаем координаты мыши относительно canvas
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    // Учитываем масштабирование canvas
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Скорректированные координаты с учетом масштаба
    const scaledX = screenX * scaleX;
    const scaledY = screenY * scaleY;

    // Центр канваса (экранные координаты)
    const canvasCenterX = canvas.width / 2;
    const canvasCenterY = canvas.height / 2;

    const player = window.player;
    if (player) {
      // Учёт смещения камеры
      mouse.x = player.x + (scaledX - canvasCenterX);
      mouse.y = player.y + (scaledY - canvasCenterY);

      // Обновляем угол поворота игрока
      player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
      
      // Временно отключаем отладочный вывод для уменьшения спама
      // debug(`Мышь: screen(${screenX}, ${screenY}), world(${mouse.x}, ${mouse.y}), угол: ${player.angle.toFixed(2)}`);
    }
  });
  
  // Обработчик клика мышью
  canvas.addEventListener('click', e => {
    debug(`Клик мышью в координатах world(${mouse.x.toFixed(0)}, ${mouse.y.toFixed(0)})`);
    
    // Здесь можно добавить логику взаимодействия с объектами
  });
  
  // Добавляем обработчик события потери фокуса окном
  window.addEventListener('blur', () => {
    // Сбрасываем все клавиши, чтобы избежать "залипания"
    Object.keys(keys).forEach(key => {
      keys[key] = false;
    });
    debug("Сброс состояния клавиш из-за потери фокуса окном");
  });
  
  debug("Система ввода инициализирована успешно");
}