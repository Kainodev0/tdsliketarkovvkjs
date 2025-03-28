let enabled = true; // Флаг включения отладки
let buffer = []; // Буфер логов
const maxLines = 30; // Максимальное количество строк в выводе

/**
 * Логирование сообщений в консоль и в элемент #debugger
 * @param {string} msg - Сообщение
 * @param {string} [type='log'] - Тип сообщения: log | warn | error
 */
export function debug(msg, type = 'log') {
  if (!enabled) return;

  const time = new Date().toLocaleTimeString();

  // Безопасное определение типа
  let level = 'LOG';
  try {
    if (typeof type === 'string') {
      level = type.toUpperCase();
    }
  } catch {
    level = 'LOG';
  }

  const line = `[${time}] [${level}] ${msg}`;

  // Безопасный вывод в консоль
  try {
    if (typeof console[type] === 'function') {
      console[type](line);
    } else {
      console.log(line);
    }
  } catch {
    console.log(line);
  }

  // Обновление буфера и отображение
  buffer.push(line);
  if (buffer.length > maxLines) buffer.shift();

  const div = document.getElementById('debugger');
  if (div) {
    div.innerText = buffer.join('\n');
  }
}

/**
 * Инициализация отладчика
 */
export function initDebugger() {
  const div = document.getElementById('debugger');
  if (div) {
    div.innerText = '[DEBUGGER INITIALIZED]\n';
  }
}

/**
 * Включение или отключение вывода логов
 * @param {boolean} on
 */
export function toggleDebug(on) {
  enabled = !!on;
}
