// src/engine/systems/VisionSystem.js
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

export class VisionSystem {
    constructor(game) {
        this.game = game;
        
        // Константы для настройки системы видимости
        this.FOV_ANGLE = Math.PI / 1.5; // 120 градусов
        this.VIEW_DISTANCE = 500;
        this.CLOSE_VISION_RADIUS = 50;
        this.RAY_COUNT = 150; // Количество лучей для более гладкого видимого полигона
        
        // Для кеширования
        this.lastPosition = new THREE.Vector3();
        this.lastAngle = 0;
        this.visionMesh = null;
        this.visionGeometry = null;
        this.visionMaterial = null;
        
        // Настройка шейдеров и материалов
        this.setupVisibility();
        
        // Добавляем слой затенения для невидимых областей
        this.setupFogOfWar();
    }
    
    setupVisibility() {
        // Создаем геометрию для полигона видимости
        this.visionGeometry = new THREE.BufferGeometry();
        const initialVertices = new Float32Array((this.RAY_COUNT + 2) * 3); // +2 для центра и замыкания
        this.visionGeometry.setAttribute('position', new THREE.BufferAttribute(initialVertices, 3));
        
        // Материал для видимости (полупрозрачный для отладки)
        this.visionMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        });
        
        // Создаем меш для области видимости
        this.visionMesh = new THREE.Mesh(this.visionGeometry, this.visionMaterial);
        this.visionMesh.rotation.x = -Math.PI / 2; // Поворачиваем, чтобы лежал в плоскости XZ
        this.visionMesh.position.y = 1; // Немного поднимаем над уровнем пола
        this.game.scene.add(this.visionMesh);
    }
    
    setupFogOfWar() {
        // Создаем шейдерный материал для эффекта тумана войны
        const fogOfWarShader = {
            uniforms: {
                tDiffuse: { value: null },
                visibilityTexture: { value: null },
                playerPos: { value: new THREE.Vector2(0.5, 0.5) },
                intensity: { value: 0.9 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float intensity;
                uniform vec2 playerPos;
                varying vec2 vUv;
                
                void main() {
                    vec4 texel = texture2D(tDiffuse, vUv);
                    
                    // Рассчитываем расстояние от текущего пикселя до позиции игрока
                    float dist = distance(vUv, playerPos);
                    
                    // Градиент затемнения (чем дальше от игрока, тем темнее)
                    float darkFactor = smoothstep(0.1, 0.5, dist) * intensity;
                    
                    // Применяем затемнение
                    vec3 darkened = mix(texel.rgb, vec3(0.0), darkFactor);
                    
                    gl_FragColor = vec4(darkened, texel.a);
                }
            `
        };
        
        // Создаем шейдерный проход для композера
        this.fogOfWarPass = new ShaderPass(fogOfWarShader);
        this.fogOfWarPass.renderToScreen = true;
        
        // Добавляем проход в композер
        this.game.composer.addPass(this.fogOfWarPass);
    }
    
    update(deltaTime) {
        const player = this.game.entityManager.getPlayer();
        if (!player) return;
        
        // Получаем текущую позицию и направление игрока
        const position = player.mesh.position;
        const angle = player.rotation;
        
        // Если позиция или направление изменились, обновляем область видимости
        if (!position.equals(this.lastPosition) || angle !== this.lastAngle) {
            this.lastPosition.copy(position);
            this.lastAngle = angle;
            
            this.updateVisionPolygon(position, angle);
            this.updateFogOfWar(position);
        }
    }
    
    updateVisionPolygon(position, angle) {
        // Получаем вершины полигона видимости
        const vertices = this.generateVisionPolygon(position, angle);
        
        // Обновляем геометрию
        const positions = this.visionGeometry.attributes.position.array;
        
        for (let i = 0; i < vertices.length; i++) {
            const vertex = vertices[i];
            positions[i * 3] = vertex.x;     // X
            positions[i * 3 + 1] = 0;        // Y (height)
            positions[i * 3 + 2] = vertex.z; // Z
        }
        
        // Отмечаем атрибуты как требующие обновления
        this.visionGeometry.attributes.position.needsUpdate = true;
        
        // Обновляем привязку индексов (если нужно)
        if (vertices.length !== this.visionGeometry.attributes.position.count) {
            this.visionGeometry.setDrawRange(0, vertices.length);
        }
    }
    
    generateVisionPolygon(position, angle) {
        const vertices = [];
        
        // Первая вершина - позиция игрока (центр полигона)
        vertices.push(new THREE.Vector3(position.x, 0, position.z));
        
        // Генерируем лучи в разных направлениях от игрока
        const halfFov = this.FOV_ANGLE / 2;
        
        for (let i = 0; i <= this.RAY_COUNT; i++) {
            // Угол от -halfFov до +halfFov относительно направления игрока
            const rayAngle = angle - halfFov + (this.FOV_ANGLE * i / this.RAY_COUNT);
            
            // Направление луча
            const direction = new THREE.Vector3(
                Math.cos(rayAngle),
                0,
                Math.sin(rayAngle)
            ).normalize();
            
            // Выполняем рейкаст для проверки видимости
            const raycastResult = this.raycast(position, direction);
            
            // Определяем конечную точку луча
            let endpoint;
            if (raycastResult.hasHit && raycastResult.distance < this.VIEW_DISTANCE) {
                // Луч столкнулся с препятствием
                endpoint = new THREE.Vector3().copy(position).add(
                    direction.multiplyScalar(raycastResult.distance)
                );
            } else {
                // Луч достиг максимальной дистанции без столкновений
                endpoint = new THREE.Vector3().copy(position).add(
                    direction.multiplyScalar(this.VIEW_DISTANCE)
                );
            }
            
            // Добавляем вершину в полигон
            vertices.push(endpoint);
        }
        
        // Замыкаем полигон (добавляем первую точку в конец)
        if (vertices.length > 2) {
            vertices.push(vertices[1].clone());
        }
        
        return vertices;
    }
    
    updateFogOfWar(position) {
        // Обновляем позицию игрока в шейдере
        // Преобразуем мировые координаты в нормализованные UV координаты
        const worldSize = 2000; // Примерный размер игрового мира
        
        this.fogOfWarPass.uniforms.playerPos.value.x = (position.x + worldSize/2) / worldSize;
        this.fogOfWarPass.uniforms.playerPos.value.y = (position.z + worldSize/2) / worldSize;
    }
    
    raycast(origin, direction) {
        // Используем физическую систему для рейкастинга
        const from = new THREE.Vector3(origin.x, origin.y, origin.z);
        
        // Преобразование направления из Three.js в формат CANNON
        const to = new THREE.Vector3().copy(from).add(
            direction.clone().multiplyScalar(this.VIEW_DISTANCE)
        );
        
        // Выполняем рейкаст через физический движок
        return this.game.physicsWorld.raycast(from, to, this.VIEW_DISTANCE);
    }
    
    // Проверяет, видна ли точка из позиции игрока
    isPointVisible(point) {
        const player = this.game.entityManager.getPlayer();
        if (!player) return false;
        
        const playerPos = player.mesh.position;
        
        // Проверка на близость к игроку (всегда видно в близком радиусе)
        const distance = playerPos.distanceTo(point);
        if (distance < this.CLOSE_VISION_RADIUS) {
            return true;
        }
        
        // Проверка на дальность видимости
        if (distance > this.VIEW_DISTANCE) {
            return false;
        }
        
        // Получаем направление к точке
        const direction = new THREE.Vector3()
            .subVectors(point, playerPos)
            .normalize();
        
        // Проверяем, находится ли точка в угле обзора
        const forward = new THREE.Vector3(
            Math.cos(player.rotation),
            0,
            Math.sin(player.rotation)
        );
        
        const angle = forward.angleTo(direction);
        if (angle > this.FOV_ANGLE / 2) {
            return false;
        }
        
        // Проверяем, нет ли препятствий между игроком и точкой
        const raycastResult = this.raycast(playerPos, direction);
        
        return !raycastResult.hasHit || raycastResult.distance > distance;
    }
    
    // Возвращает данные о видимости для использования другими системами
    getVisibilityData() {
        return {
            visiblePoints: this.visionGeometry ? 
                Array.from(this.visionGeometry.attributes.position.array) : 
                [],
            viewAngle: this.lastAngle,
            viewDistance: this.VIEW_DISTANCE,
            closeVisionRadius: this.CLOSE_VISION_RADIUS,
            fovAngle: this.FOV_ANGLE
        };
    }
    
    // Если нужно изменить параметры видимости в процессе игры
    setVisibilityParams(params) {
        if (params.viewDistance) this.VIEW_DISTANCE = params.viewDistance;
        if (params.fovAngle) this.FOV_ANGLE = params.fovAngle;
        if (params.closeVisionRadius) this.CLOSE_VISION_RADIUS = params.closeVisionRadius;
        
        // Обновляем видимость после изменения параметров
        this.lastPosition.set(0, 0, 0); // Сбрасываем для принудительного обновления
    }
}