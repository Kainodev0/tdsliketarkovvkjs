let debugDiv = null;

export function initDebugger() {
  debugDiv = document.getElementById('debugger');
  if (debugDiv) debugDiv.innerText = '[DEBUGGER READY]\n';
}

export function debug(msg, type = 'log') {
  if (!debugDiv) return;
  const prefix = type === 'error' ? '[ERROR]' : '[LOG]';
  debugDiv.innerText += `\n${prefix} ${msg}`;
  debugDiv.scrollTop = debugDiv.scrollHeight;
}
