/**
 * Система загрузки игровых ресурсов (изображения, звуки, данные)
 */

import { debug } from '../engine/debugger.js';

// Объект для хранения загруженных ресурсов
export const assets = {
  images: {},
  sounds: {},
  data: {}
};

// Счетчики для отслеживания прогресса загрузки
let totalAssets = 0;
let loadedAssets = 0;

/**
 * Загрузка изображения
 * @param {string} id - Идентификатор изображения
 * @param {string} src - Путь к файлу изображения
 * @returns {Promise} - Промис, разрешающийся при загрузке изображения
 */
function loadImage(id, src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      assets.images[id] = img;
      loadedAssets++;
      updateLoadingProgress();
      resolve(img);
    };
    img.onerror = () => {
      reject(new Error(`Не удалось загрузить изображение: ${src}`));
    };
    img.src = src;
  });
}

/**
 * Загрузка звука
 * @param {string} id - Идентификатор звука
 * @param {string} src - Путь к звуковому файлу
 * @returns {Promise} - Промис, разрешающийся при загрузке звука
 */
function loadSound(id, src) {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.oncanplaythrough = () => {
      assets.sounds[id] = audio;
      loadedAssets++;
      updateLoadingProgress();
      resolve(audio);
    };
    audio.onerror = () => {
      reject(new Error(`Не удалось загрузить звук: ${src}`));
    };
    audio.src = src;
    audio.load();
  });
}

/**
 * Загрузка JSON-данных
 * @param {string} id - Идентификатор данных
 * @param {string} src - Путь к JSON-файлу
 * @returns {Promise} - Промис, разрешающийся при загрузке данных
 */
function loadJSON(id, src) {
  return fetch(src)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      assets.data[id] = data;
      loadedAssets++;
      updateLoadingProgress();
      return data;
    });
}

/**
 * Обновление индикатора прогресса загрузки
 */
function updateLoadingProgress() {
  const progress = Math.floor((loadedAssets / totalAssets) * 100);
  
  // Обновление визуального индикатора загрузки
  const loadingBar = document.getElementById('loadingBar');
  const loadingText = document.getElementById('loadingText');
  
  if (loadingBar) {
    loadingBar.style.width = `${progress}%`;
  }
  
  if (loadingText) {
    loadingText.textContent = `Загрузка ресурсов... ${progress}%`;
  }
  
  debug(`Loading progress: ${progress}% (${loadedAssets}/${totalAssets})`);
}

/**
 * Основная функция загрузки всех игровых ресурсов
 * @returns {Promise} - Промис, разрешающийся при загрузке всех ресурсов
 */
export async function loadAssets() {
  debug('Starting asset loading...');
  
  // Сбрасываем счетчики
  totalAssets = 0;
  loadedAssets = 0;
  
  // Список ресурсов для загрузки
  const imagesToLoad = [
    // Characters
    { id: 'player', src: 'assets/sprites/characters/player.svg' },
    { id: 'enemy', src: 'assets/sprites/characters/enemy.svg' },
    { id: 'trader', src: 'assets/sprites/characters/trader.svg' },

    // Weapons
    { id: 'pistol', src: 'assets/sprites/weapons/pistol.svg' },
    { id: 'shotgun', src: 'assets/sprites/weapons/shotgun.svg' },
    { id: 'rifle', src: 'assets/sprites/weapons/rifle.svg' },

    // Loot
    { id: 'crate', src: 'assets/sprites/loot/crate.svg' },
    { id: 'medkit', src: 'assets/sprites/loot/medkit.svg' },
    { id: 'ammo_box', src: 'assets/sprites/loot/ammo_box.svg' }
  ];
  
  // Обновляем общее количество ресурсов
  totalAssets = imagesToLoad.length + soundsToLoad.length + dataToLoad.length;
  
  try {
    // Загружаем все изображения
    const imagePromises = imagesToLoad.map(img => loadImage(img.id, img.src));
    
    // Загружаем все звуки
    const soundPromises = soundsToLoad.map(sound => loadSound(sound.id, sound.src));
    
    // Загружаем все данные
    const dataPromises = dataToLoad.map(data => loadJSON(data.id, data.src));
    
    // Ждем загрузки всех ресурсов
    await Promise.all([
      ...imagePromises,
      ...soundPromises,
      ...dataPromises
    ]);
    
    debug('All assets loaded successfully');
    return assets;
    
  } catch (error) {
    debug(`Error loading assets: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Получить загруженное изображение по ID
 * @param {string} id - Идентификатор изображения
 * @returns {HTMLImageElement} - Элемент изображения
 */
export function getImage(id) {
  if (!assets.images[id]) {
    debug(`Image not found: ${id}`, 'error');
    // Возвращаем заглушку вместо отсутствующего изображения
    return createPlaceholderImage();
  }
  return assets.images[id];
}

/**
 * Получить загруженный звук по ID
 * @param {string} id - Идентификатор звука
 * @returns {HTMLAudioElement} - Аудио элемент
 */
export function getSound(id) {
  if (!assets.sounds[id]) {
    debug(`Sound not found: ${id}`, 'error');
    return null;
  }
  // Создаем копию звука для возможности одновременного воспроизведения
  return assets.sounds[id].cloneNode();
}

/**
 * Получить загруженные данные по ID
 * @param {string} id - Идентификатор данных
 * @returns {Object} - Объект с данными
 */
export function getData(id) {
  if (!assets.data[id]) {
    debug(`Data not found: ${id}`, 'error');
    return null;
  }
  return assets.data[id];
}

/**
 * Создание изображения-заглушки
 * @returns {HTMLCanvasElement} - Canvas элемент с заглушкой
 */
function createPlaceholderImage() {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  
  // Рисуем сетку
  ctx.fillStyle = '#FF00FF'; // Ярко-розовый цвет для отсутствующих текстур
  ctx.fillRect(0, 0, 32, 32);
  
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, 16, 16);
  ctx.fillRect(16, 16, 16, 16);
  
  return canvas;
}