let enabled = true;
let buffer = [];
const maxLines = 30;

export function debug(msg, type = 'log') {
  if (!enabled) return;

  const time = new Date().toLocaleTimeString();

  // Безопасное приведение типа к строке и uppercase
  const level = typeof type === 'string' ? type.toUpperCase() : 'LOG';
  const line = `[${time}] [${level}] ${msg}`;

  // Всегда используем console.log, чтобы избежать ошибки с несуществующим методом
  console.log(line);

  buffer.push(line);
  if (buffer.length > maxLines) buffer.shift();

  const div = document.getElementById('debugger');
  if (div) {
    div.innerText = buffer.join('\n');
  }
}

export function initDebugger() {
  const div = document.getElementById('debugger');
  if (div) {
    div.innerText = '[DEBUGGER INITIALIZED]\n';
  }
}

export function toggleDebug(on) {
  enabled = on;
}
