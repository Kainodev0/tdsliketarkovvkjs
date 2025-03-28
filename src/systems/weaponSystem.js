// src/systems/weaponSystem.js
import { debug } from '../engine/debugger.js';

// Список активных снарядов
export const projectiles = [];

// Создает оружие указанного типа
export function createWeapon(type) {
  return {
    type,
    name: type === 'pistol' ? 'Пистолет' : 'Дробовик',
    damage: type === 'pistol' ? 15 : 40,
    fireRate: type === 'pistol' ? 0.5 : 0.8,
    accuracy: type === 'pistol' ? 0.9 : 0.6,
    range: type === 'pistol' ? 300 : 150,
    reloadTime: type === 'pistol' ? 1.5 : 2.5,
    magazineSize: type === 'pistol' ? 8 : 5,
    currentAmmo: type === 'pistol' ? 8 : 5,
    isReloading: false
  };
}

// Заглушки для функций, которые используются в других модулях
export function fireWeapon() { return true; }
export function startReload() { }
export function updateProjectiles() { }
export function drawProjectiles() { }
export function drawWeapon() { }