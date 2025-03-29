// src/engine/player.js
// Исправленное определение игрока

// Временно отключаем импорт, если возникают проблемы с инициализацией
// import { createInventory } from '../systems/inventory/inventory.js';

export const player = {
  x: 400,            // Начальная позиция по X
  y: 300,            // Начальная позиция по Y
  angle: 0,          // Угол поворота (направление взгляда)
  speed: 5,          // Скорость движения (увеличена)
  radius: 15,        // Радиус коллизии
  color: '#4af',     // Цвет
  health: 100,       // Здоровье
  maxHealth: 100,    // Максимальное здоровье
  inventory: null,   // Инвентарь (будет инициализирован позже)
  weapon: null,      // Оружие
  armor: null,       // Броня
  isAiming: false    // Прицеливание
};

// Экспортируем еще и функцию инициализации для надежности
export function initPlayer() {
  // Проверим, инициализирован ли уже игрок в window
  if (window.player) {
    // Если да, проверим все ли поля заполнены
    if (typeof window.player.speed !== 'number') window.player.speed = 5;
    if (typeof window.player.x !== 'number') window.player.x = 400;
    if (typeof window.player.y !== 'number') window.player.y = 300;
    if (typeof window.player.radius !== 'number') window.player.radius = 15;
    if (typeof window.player.angle !== 'number') window.player.angle = 0;
    
    return window.player;
  }
  
  // Если игрока в window еще нет, создаем его
  window.player = { ...player };
  return window.player;
}