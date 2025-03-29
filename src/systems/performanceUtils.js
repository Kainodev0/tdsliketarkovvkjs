/**
 * Этот файл содержит оптимизации производительности для игры
 * Его нужно добавить в проект как src/systems/performanceUtils.js
 */

import { debug } from '../engine/debugger.js';

// Переменная для хранения времени последнего кадра
let lastFrameTime = 0;
// Переменная для хранения FPS
let fps = 0;
// Счётчик обновлений для расчёта среднего FPS
let frameCount = 0;
let totalFPS = 0;
// Максимальное количество кадров для среднего значения
const MAX_FRAMES = 60;

/**
 * Мониторинг производительности игрового цикла
 * @param {DOMHighResTimeStamp} timestamp - Временная метка анимационного кадра
 * @returns {Object} - Объект с метриками производительности
 */
export function monitorPerformance(timestamp) {
  // Вычисляем FPS
  const currentFPS = lastFrameTime ? 1000 / (timestamp - lastFrameTime) : 0;
  lastFrameTime = timestamp;
  
  // Сохраняем для расчёта среднего значения
  totalFPS += currentFPS;
  frameCount++;
  
  // Сбрасываем счётчики каждые MAX_FRAMES кадров
  if (frameCount >= MAX_FRAMES) {
    fps = totalFPS / frameCount;
    totalFPS = 0;
    frameCount = 0;
  }
  
  return {
    fps: Math.round(currentFPS),
    averageFPS: Math.round(fps),
    timestamp
  };
}

/**
 * Отображение метрик производительности на игровом интерфейсе
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {Object} metrics - Метрики производительности
 * @param {boolean} showFPS - Флаг отображения FPS
 */
export function drawPerformanceInfo(ctx, metrics, showFPS = true) {
  if (!showFPS) return;
  
  const { fps, averageFPS } = metrics;
  
  // Определяем цвет на основе производительности
  const fpsColor = fps > 50 ? '#0f0' : // зелёный для > 50 FPS
                    fps > 30 ? '#ff0' : // жёлтый для 30-50 FPS
                               '#f00';  // красный для < 30 FPS
  
  // Сохраняем контекст перед изменением
  ctx.save();
  
  // Рисуем информацию о FPS
  ctx.font = '14px monospace';
  ctx.fillStyle = fpsColor;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillText(`FPS: ${fps}`, ctx.canvas.width - 10, 10);
  ctx.fillText(`Средн.: ${averageFPS}`, ctx.canvas.width - 10, 30);
  
  // Восстанавливаем контекст
  ctx.restore();
}

/**
 * Оптимизирует отрисовку, прорежая кадры при необходимости
 * @param {number} targetFPS - Целевой FPS (30 или 60)
 * @param {Object} metrics - Метрики производительности
 * @returns {boolean} - True, если кадр нужно отрисовать
 */
export function shouldRenderFrame(targetFPS, metrics) {
  // Если средний FPS меньше 20, вводим прореживание кадров
  if (metrics.averageFPS < 20 && targetFPS === 60) {
    // Рисуем каждый второй кадр
    return frameCount % 2 === 0;
  }
  return true;
}

/**
 * Функция для замера времени выполнения блока кода
 * @param {Function} callback - Функция для замера времени
 * @param {string} label - Метка для отображения в логах
 * @returns {*} - Результат выполнения callback
 */
export function measureTime(callback, label = 'Operation') {
  const startTime = performance.now();
  const result = callback();
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  // Логируем только медленные операции (> 16 мс ≈ задержка для 60 FPS)
  if (duration > 16) {
    debug(`⚠️ Медленная операция: ${label} заняла ${duration.toFixed(2)}ms`, 'warn');
  }
  
  return result;
}

/**
 * Оптимизирует частоту вызова функции
 * @param {Function} func - Функция для оптимизации
 * @param {number} delay - Задержка между вызовами в мс
 * @returns {Function} - Оптимизированная функция
 */
export function throttle(func, delay = 100) {
  let lastCall = 0;
  
  return function(...args) {
    const now = performance.now();
    if (now - lastCall < delay) return;
    
    lastCall = now;
    return func.apply(this, args);
  };
}

/**
 * Функция для анализа памяти (работает только в DevTools)
 */
export function analyzeMemory() {
  if (window.performance && window.performance.memory) {
    const memory = window.performance.memory;
    debug(`Использование памяти:
    Лимит: ${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)} MB
    Всего: ${Math.round(memory.totalJSHeapSize / 1024 / 1024)} MB
    Использовано: ${Math.round(memory.usedJSHeapSize / 1024 / 1024)} MB`);
  } else {
    debug('Анализ памяти недоступен в этом браузере');
  }
}

/**
 * Интегрирует инструменты производительности в игровой цикл
 * @param {Function} gameLoopFunction - Оригинальная функция игрового цикла
 * @returns {Function} - Новая функция игрового цикла с мониторингом производительности
 */
export function enhanceGameLoop(gameLoopFunction) {
  return function(timestamp) {
    // Мониторим производительность
    const metrics = monitorPerformance(timestamp);
    
    // Выполняем оригинальный игровой цикл
    try {
      gameLoopFunction(timestamp);
      
      // Отображаем информацию о производительности в отладчике
      if (frameCount % 60 === 0) { // Обновляем каждую секунду
        debug(`FPS: ${metrics.averageFPS} | Память: ${Math.round(window.performance?.memory?.usedJSHeapSize / 1024 / 1024) || '???'} MB`);
      }
    } catch (error) {
      debug(`❌ Ошибка в игровом цикле: ${error.message}`, 'error');
      console.error(error);
    }
    
    // Запрашиваем следующий кадр анимации
    requestAnimationFrame(enhanceGameLoop(gameLoopFunction));
  };
}