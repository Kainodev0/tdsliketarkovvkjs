let enabled = true;
let buffer = [];
const maxLines = 30;

export function debug(msg, type = 'log') {
  if (!enabled) return;

  const time = new Date().toLocaleTimeString();
  const line = `[${time}] [${type.toUpperCase()}] ${msg}`;
  console[type](line);

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
