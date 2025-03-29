// src/engine/core/Game.js
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';

// Импорт игровых подсистем
import { SceneManager } from '../rendering/SceneManager.js';
import { InputManager } from './InputManager.js';
import { ResourceManager } from './ResourceManager.js';
import { PhysicsWorld } from './PhysicsWorld.js';
import { AudioManager } from './AudioManager.js';
import { EntityManager } from '../systems/EntityManager.js';
import { VisionSystem } from '../systems/VisionSystem.js';
import { UIManager } from '../../ui/UIManager.js';

export class Game {
    constructor(canvas) {
        // Инициализация менеджеров подсистем
        this.canvas = canvas;
        this.clock = new THREE.Clock();
        this.debug = {
            enabled: true,
            stats: null
        };
        
        // Хранит состояние игры
        this.state = {
            isPaused: false,
            currentScene: 'map', // 'map', 'inventory', 'mainMenu'
            showFPS: true,
            showDebug: false
        };
        
        // Инициализация подсистем
        this.init();
    }
    
    init() {
        // Настройка THREE.js
        this.setupThree();
        
        // Инициализация менеджеров
        this.resourceManager = new ResourceManager(this);
        this.inputManager = new InputManager(this);
        this.physicsWorld = new PhysicsWorld(this);
        this.sceneManager = new SceneManager(this);
        this.audioManager = new AudioManager(this);
        this.entityManager = new EntityManager(this);
        this.visionSystem = new VisionSystem(this);
        this.uiManager = new UIManager(this);
        
        // Настройка обработчиков событий
        this.setupEventListeners();
        
        // Запуск цикла обновления
        this.animate();
        
        console.log('PixelEscape on Three.js initialized');
    }
    
    setupThree() {
        // Создание сцены
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x111111);
        
        // Ортографическая камера для вида сверху
        const aspect = this.canvas.width / this.canvas.height;
        const frustumSize = 500;
        this.camera = new THREE.OrthographicCamera(
            frustumSize * aspect / -2,
            frustumSize * aspect / 2,
            frustumSize / 2,
            frustumSize / -2,
            0.1,
            2000
        );
        this.camera.position.set(0, 800, 0);
        this.camera.rotation.x = -Math.PI / 2; // Смотрит прямо вниз
        this.camera.updateProjectionMatrix();
        
        // Настройка рендерера
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(this.canvas.width, this.canvas.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Настройка постобработки
        this.composer = new EffectComposer(this.renderer);
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        
        // Настройка отладочных инструментов
        if (this.debug.enabled) {
            this.debug.stats = new Stats();
            document.body.appendChild(this.debug.stats.dom);
        }
        
        // Обработчик изменения размера окна
        this.handleResize();
        window.addEventListener('resize', () => this.handleResize());
    }
    
    handleResize() {
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        
        // Обновляем размеры рендерера
        this.renderer.setSize(width, height);
        this.composer.setSize(width, height);
        
        // Обновляем соотношение сторон камеры
        const aspect = width / height;
        const frustumSize = 500;
        
        this.camera.left = frustumSize * aspect / -2;
        this.camera.right = frustumSize * aspect / 2;
        this.camera.top = frustumSize / 2;
        this.camera.bottom = frustumSize / -2;
        this.camera.updateProjectionMatrix();
    }
    
    setupEventListeners() {
        // Обработка основных команд
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.togglePause();
            }
            if (e.key === 'Tab') {
                e.preventDefault();
                this.toggleInventory();
            }
        });
    }
    
    togglePause() {
        this.state.isPaused = !this.state.isPaused;
        console.log(this.state.isPaused ? 'Game Paused' : 'Game Resumed');
    }
    
    toggleInventory() {
        const isInventoryOpen = this.state.currentScene === 'inventory';
        this.state.currentScene = isInventoryOpen ? 'map' : 'inventory';
        console.log(`Switched to ${this.state.currentScene} view`);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = this.clock.getDelta();
        
        if (!this.state.isPaused) {
            // Обновление физики
            this.physicsWorld.update(deltaTime);
            
            // Обновление всех сущностей
            this.entityManager.update(deltaTime);
            
            // Обновление системы видимости
            this.visionSystem.update(deltaTime);
            
            // Обновление сцены
            this.sceneManager.update(deltaTime);
        }
        
        // Обновление UI (даже когда игра на паузе)
        this.uiManager.update(deltaTime);
        
        // Рендеринг
        this.composer.render();
        
        // Обновление статистики производительности
        if (this.debug.enabled && this.debug.stats) {
            this.debug.stats.update();
        }
    }
    
    loadScene(sceneName) {
        this.sceneManager.loadScene(sceneName);
    }
}