// src/main.js
import { Game } from './engine/core/Game.js';

// Глобальные переменные
let game = null;

/**
 * Инициализация игры
 */
export async function startGame() {
    try {
        console.log('🚀 Initializing PixelEscape...');
        
        // Получаем canvas
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            throw new Error('Canvas element not found!');
        }
        
        // Показываем экран загрузки
        showLoadingScreen(true, 'Инициализация игрового движка...');
        
        // Инициализируем игру
        game = new Game(canvas);
        
        // Устанавливаем обработчики событий
        setupEventListeners();
        
        // Загружаем ресурсы и начальную сцену
        await loadResources();
        
        // Скрываем экран загрузки
        showLoadingScreen(false);
        
        console.log('✅ Game initialized successfully!');
    } catch (error) {
        console.error('💥 Failed to initialize game:', error);
        showErrorScreen(error.message);
    }
}

/**
 * Настройка обработчиков событий
 */
function setupEventListeners() {
    // Обработчик для кнопки отладки
    const debugButton = document.getElementById('debugButton');
    if (debugButton) {
        debugButton.addEventListener('click', () => {
            toggleDebugMode();
        });
    }
    
    // Обработчик для кнопки инвентаря
    const inventoryButton = document.getElementById('inventoryButton');
    if (inventoryButton) {
        inventoryButton.addEventListener('click', () => {
            game.toggleInventory();
        });
    }
    
    // Обработчик для кнопки меню
    const menuButton = document.getElementById('menuButton');
    if (menuButton) {
        menuButton.addEventListener('click', () => {
            game.togglePause();
        });
    }
    
    // Настраиваем кастомный курсор
    document.addEventListener('mousemove', (e) => {
        const cursor = document.getElementById('customCursor');
        if (cursor) {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
        }
    });
    
    // Запрет контекстного меню правой кнопкой мыши
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
}

/**
 * Загрузка ресурсов и инициализация сцены
 */
async function loadResources() {
    try {
        // Обновляем индикатор загрузки
        showLoadingScreen(true, 'Загрузка ресурсов...');
        updateLoadingProgress(10);
        
        // Загружаем данные (текстуры, модели, звуки)
        await game.resourceManager.loadAllResources((progress) => {
            updateLoadingProgress(10 + progress * 70); // От 10% до 80%
        });
        
        updateLoadingProgress(80);
        showLoadingScreen(true, 'Загрузка карты...');
        
        // Инициализируем карту и объекты
        await game.sceneManager.loadScene('map1');
        
        updateLoadingProgress(90);
        showLoadingScreen(true, 'Настройка игровых систем...');
        
        // Создаем игрока
        await game.entityManager.createPlayer();
        
        updateLoadingProgress(100);
        showLoadingScreen(true, 'Готово!');
        
        // Немного задержки, чтобы увидеть 100%
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return true;
    } catch (error) {
        console.error('Error loading resources:', error);
        throw error;
    }
}

/**
 * Управление отображением экрана загрузки
 */
function showLoadingScreen(show, message = '') {
    const loadingScreen = document.getElementById('loadingScreen');
    const loadingText = document.getElementById('loadingText');
    
    if (!loadingScreen) return;
    
    if (show) {
        loadingScreen.style.display = 'flex';
        if (loadingText && message) {
            loadingText.textContent = message;
        }
    } else {
        loadingScreen.style.display = 'none';
    }
}

/**
 * Обновление индикатора прогресса загрузки
 */
function updateLoadingProgress(percent) {
    const loadingBar = document.getElementById('loadingBar');
    if (loadingBar) {
        loadingBar.style.width = `${percent}%`;
    }
}

/**
 * Отображение экрана ошибки
 */
function showErrorScreen(message) {
    const loadingScreen = document.getElementById('loadingScreen');
    if (!loadingScreen) return;
    
    loadingScreen.style.display = 'flex';
    loadingScreen.innerHTML = `
        <div class="error-container">
            <h1 style="color: #f44; margin-bottom: 20px;">Ошибка</h1>
            <p style="color: #fff; margin-bottom: 30px;">${message}</p>
            <button class="ui-button" onclick="location.reload()">Перезагрузить</button>
        </div>
    `;
}

/**
 * Включение/выключение режима отладки
 */
function toggleDebugMode() {
    if (!game) return;
    
    game.state.showDebug = !game.state.showDebug;
    
    const debugger = document.getElementById('debugger');
    if (debugger) {
        debugger.classList.toggle('collapsed', !game.state.showDebug);
    }
    
    console.log(`Debug mode: ${game.state.showDebug ? 'enabled' : 'disabled'}`);
}

// Запускаем игру при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    startGame();
});