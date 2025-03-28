import { createInventory } from '../systems/inventory/inventory.js';

export const player = {
  x: 400,
  y: 300,
  angle: 0,
  speed: 2,
  radius: 15,
  color: '#4af',
  health: 100,
  maxHealth: 100,
  inventory: createInventory(10, 8),
  weapon: null,
  armor: null,
  isAiming: false
};