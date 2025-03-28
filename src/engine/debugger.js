let enabled = true; // Флаг включения отладки
let buffer = []; // Буфер логов
const maxLines = 30; // Максимум строк в окне отладки

/**
 * Логирование сообщений в консоль и в отладочный блок на экране
 * @param {string} msg - Сообщение для вывода
 * @param {string} [type='log'] - Уровень сообщения ('log', 'warn', 'error')
 */
export function debug(msg, type = 'log') {
  if (!enabled) return;

  const time = new Date().toLocaleTimeString();

  // Безопасно преобразуем тип логирования в верхний регистр
  const level = typeof type === 'string' ? type.toUpperCase() : 'LOG';
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

  // Обновление буфера и вывода в HTML
  buffer.push(line);
  if (buffer.length > maxLines) buffer.shift();

  const div = document.getElementById('debugger');
  if (div) {
    div.innerText = buffer.join('\n');
  }
}

/**
 * Инициализация отладчика (выводится при старте игры)
 */
export function initDebugger() {
  const div = document.getElementById('debugger');
  if (div) {
    div.innerText = '[DEBUGGER INITIALIZED]\n';
  }
}

/**
 * Включение или отключение логирования
 * @param {boolean} on - true = включить, false = выключить
 */
export function toggleDebug(on) {
  enabled = on;
}
