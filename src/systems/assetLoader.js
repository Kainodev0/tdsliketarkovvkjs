/**
 * Система загрузки игровых ресурсов (изображения, звуки, данные)
 */

import { debug } from '../engine/debugger.js';

// Получаем базовый путь к текущему модулю (для GitHub Pages)
const base = new URL('.', import.meta.url).pathname;

// Объект для хранения загруженных ресурсов
export const assets = {
  images: {},
  sounds: {},
  data: {}
};

// Счетчики для отслеживания прогресса загрузки
let totalAssets = 0;
let loadedAssets = 0;

// Добавляем пустые массивы
const soundsToLoad = [];
const dataToLoad = [
  { id: 'items', src: `${base}../data/items.json` },
  { id: 'maps', src: `${base}../data/maps.json` },
  { id: 'weapons', src: `${base}../data/weapons.json` }
];

/**
 * Загрузка изображения
 * @param {string} id - Идентификатор изображения
 * @param {string} src - Путь к файлу изображения
 * @returns {Promise} - Промис, разрешающийся при загрузке изображения
 */
function loadImage(id, src) {
  return new Promise((resolve, reject) => {
    debug(`Attempting to load image: ${id} from ${src}`);
    const img = new Image();
    img.onload = () => {
      debug(`Successfully loaded image: ${id}`);
      assets.images[id] = img;
      loadedAssets++;
      updateLoadingProgress();
      resolve(img);
    };
    img.onerror = (err) => {
      debug(`Failed to load image: ${id}. Error: ${err}`, 'error');
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
    debug(`Attempting to load sound: ${id} from ${src}`);
    const audio = new Audio();
    audio.oncanplaythrough = () => {
      debug(`Successfully loaded sound: ${id}`);
      assets.sounds[id] = audio;
      loadedAssets++;
      updateLoadingProgress();
      resolve(audio);
    };
    audio.onerror = (err) => {
      debug(`Failed to load sound: ${id}. Error: ${err}`, 'error');
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
  debug(`Attempting to load JSON: ${id} from ${src}`);
  return fetch(src)
    .then(response => {
      if (!response.ok) {
        debug(`HTTP Error when loading JSON ${id}: ${response.status}`, 'error');
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      debug(`Successfully loaded JSON: ${id}`);
      assets.data[id] = data;
      loadedAssets++;
      updateLoadingProgress();
      return data;
    })
    .catch(error => {
      debug(`Failed to load JSON: ${id}. Error: ${error.message}`, 'error');
      throw error;
    });
}

/**
 * Обновление индикатора прогресса загрузки
 */
function updateLoadingProgress() {
  const progress = Math.floor((loadedAssets / totalAssets) * 100);
  
  debug(`Loading progress: ${progress}% (${loadedAssets}/${totalAssets})`);
  
  // Обновление визуального индикатора загрузки
  const loadingBar = document.getElementById('loadingBar');
  const loadingText = document.getElementById('loadingText');
  
  if (loadingBar) {
    loadingBar.style.width = `${progress}%`;
  }
  
  if (loadingText) {
    loadingText.textContent = `Загрузка ресурсов... ${progress}%`;
  }
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
    { id: 'player', src: `${base}../assets/sprites/characters/player.svg` },
    { id: 'enemy', src: `${base}../assets/sprites/characters/enemy.svg` },
    { id: 'trader', src: `${base}../assets/sprites/characters/trader.svg` },
  
    // Weapons
    { id: 'pistol', src: `${base}../assets/sprites/weapons/pistol.svg` },
    { id: 'shotgun', src: `${base}../assets/sprites/weapons/shotgun.svg` },
    { id: 'rifle', src: `${base}../assets/sprites/weapons/rifle.svg` },
  
    // Loot
    { id: 'crate', src: `${base}../assets/sprites/loot/crate.svg` },
    { id: 'medkit', src: `${base}../assets/sprites/loot/medkit.svg` },
    { id: 'ammo_box', src: `${base}../assets/sprites/loot/ammo_box.svg` }
  ];
  
  // Обновляем общее количество ресурсов
  totalAssets = imagesToLoad.length + soundsToLoad.length + dataToLoad.length;
  
  debug(`Total assets to load: ${totalAssets}`);
  
  try {
    // Загружаем все изображения
    const imagePromises = imagesToLoad.map(img => loadImage(img.id, img.src));
    
    // Загружаем все звуки
    const soundPromises = soundsToLoad.length ? 
      soundsToLoad.map(sound => loadSound(sound.id, sound.src)) : 
      [];
    
    // Загружаем все данные
    const dataPromises = dataToLoad.map(data => loadJSON(data.id, data.src));
    
    // Ждем загрузки всех ресурсов
    const loadedResources = await Promise.all([
      ...imagePromises,
      ...soundPromises,
      ...dataPromises
    ]);
    
    debug('All assets loaded successfully');
    return assets;
    
  } catch (error) {
    debug(`Critical error loading assets: ${error.message}`, 'error');
    throw error;
  }
}

// Для отладки - добавляем функцию проверки загруженных ассетов
export function debugAssets() {
  debug('Loaded Images:', Object.keys(assets.images));
  debug('Loaded Sounds:', Object.keys(assets.sounds));
  debug('Loaded Data:', Object.keys(assets.data));
}