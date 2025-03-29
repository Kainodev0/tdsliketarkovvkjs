// src/engine/core/PhysicsWorld.js
import * as CANNON from 'cannon-es';
import * as THREE from 'three';

export class PhysicsWorld {
    constructor(game) {
        this.game = game;
        this.bodies = [];
        this.meshes = [];
        
        // Константы
        this.timeStep = 1/60;
        this.debugMode = false;
        
        // Настройка физического мира
        this.world = new CANNON.World({
            gravity: new CANNON.Vec3(0, -9.82, 0)
        });
        
        // Настройка параметров столкновений
        this.world.broadphase = new CANNON.SAPBroadphase(this.world);
        this.world.allowSleep = true;
        this.world.defaultContactMaterial = new CANNON.ContactMaterial(
            new CANNON.Material('default'),
            new CANNON.Material('default'),
            {
                friction: 0.3,
                restitution: 0.2,
                contactEquationStiffness: 1e7,
                contactEquationRelaxation: 3
            }
        );
        
        // Настройка визуализации отладки
        if (this.debugMode) {
            this.debugRenderer = new CannonDebugRenderer(
                this.game.scene,
                this.world
            );
        }
    }
    
    // Добавление физического тела
    addBody(body, mesh) {
        this.world.addBody(body);
        
        if (mesh) {
            this.bodies.push(body);
            this.meshes.push(mesh);
        }
        
        return body;
    }
    
    // Удаление физического тела
    removeBody(body, mesh) {
        this.world.removeBody(body);
        
        const bodyIndex = this.bodies.indexOf(body);
        
        if (bodyIndex !== -1) {
            this.bodies.splice(bodyIndex, 1);
            this.meshes.splice(bodyIndex, 1);
        }
    }
    
    // Обновление физического мира
    update(deltaTime) {
        // Фиксированный шаг для физики (не должен зависеть от частоты кадров)
        this.world.step(this.timeStep);
        
        // Обновление позиций всех объектов со связанными физическими телами
        for (let i = 0; i < this.bodies.length; i++) {
            const body = this.bodies[i];
            const mesh = this.meshes[i];
            
            // Обновляем позицию объекта в соответствии с физической симуляцией
            mesh.position.copy(body.position);
            mesh.quaternion.copy(body.quaternion);
        }
        
        // Обновление визуализации отладки, если включена
        if (this.debugMode && this.debugRenderer) {
            this.debugRenderer.update();
        }
    }
    
    // Создание физического тела для стены
    createWallBody(x, y, width, height, depth = 20) {
        const halfExtents = new CANNON.Vec3(width/2, depth/2, height/2);
        const boxShape = new CANNON.Box(halfExtents);
        
        const body = new CANNON.Body({
            mass: 0, // Статическое тело (масса = 0)
            position: new CANNON.Vec3(x + width/2, depth/2, y + height/2),
            shape: boxShape,
            material: new CANNON.Material('wall')
        });
        
        this.world.addBody(body);
        return body;
    }
    
    // Создание физического тела для игрока
    createPlayerBody(x, y, radius) {
        // Используем цилиндр для физического тела игрока
        const shape = new CANNON.Cylinder(radius, radius, 40, 8);
        
        const body = new CANNON.Body({
            mass: 70, // Масса игрока в кг
            position: new CANNON.Vec3(x, 20, y),
            shape: shape,
            material: new CANNON.Material('player'),
            linearDamping: 0.9, // Затухание линейного движения
            angularDamping: 0.9 // Затухание вращения
        });
        
        // Ограничение вращения по осям X и Z (игрок не должен падать)
        body.fixedRotation = true;
        body.updateMassProperties();
        
        this.world.addBody(body);
        return body;
    }
    
    // Создание физического тела для предмета
    createItemBody(x, y, size = 10) {
        const shape = new CANNON.Box(new CANNON.Vec3(size/2, size/2, size/2));
        
        const body = new CANNON.Body({
            mass: 5, // Легкий предмет
            position: new CANNON.Vec3(x, size/2, y),
            shape: shape,
            material: new CANNON.Material('item'),
            linearDamping: 0.5,
            angularDamping: 0.5
        });
        
        this.world.addBody(body);
        return body;
    }
    
    // Создание физического тела для снаряда/пули
    createProjectileBody(x, y, z, direction, speed = 20) {
        const radius = 1;
        const shape = new CANNON.Sphere(radius);
        
        const body = new CANNON.Body({
            mass: 0.1, // Очень легкая пуля
            position: new CANNON.Vec3(x, y, z),
            shape: shape,
            material: new CANNON.Material('projectile')
        });
        
        // Установка начальной скорости в направлении выстрела
        const velocity = direction.clone().normalize().multiplyScalar(speed);
        body.velocity.set(velocity.x, velocity.y, velocity.z);
        
        // Не позволяем пуле вращаться
        body.fixedRotation = true;
        body.updateMassProperties();
        
        // Коллбэк для обработки столкновений
        body.addEventListener('collide', (event) => {
            // Обработка попадания пули
            const target = event.body;
            // Здесь будет логика урона, эффектов и т.д.
        });
        
        this.world.addBody(body);
        return body;
    }
    
    // Выполнение рейкаста для проверки видимости
    raycast(from, direction, maxDistance = 1000) {
        // Создаем рейкаст
        const raycastResult = new CANNON.RaycastResult();
        const ray = new CANNON.Ray(from, direction);
        
        // Результаты рейкаста
        ray.intersectWorld(this.world, {
            mode: CANNON.Ray.CLOSEST,
            result: raycastResult,
            skipBackfaces: true,
            collisionFilterMask: -1 // Проверять коллизии со всеми
        });
        
        if (raycastResult.hasHit) {
            return {
                hasHit: true,
                hitPointWorld: raycastResult.hitPointWorld,
                hitNormalWorld: raycastResult.hitNormalWorld,
                body: raycastResult.body,
                distance: raycastResult.distance
            };
        }
        
        return {
            hasHit: false,
            distance: maxDistance
        };
    }
}

// Класс для визуализации физических тел (для отладки)
class CannonDebugRenderer {
    constructor(scene, world, options = {}) {
        this.scene = scene;
        this.world = world;
        
        this.options = Object.assign({
            color: 0x00ff00,
            wireframe: true
        }, options);
        
        this._meshes = [];
        
        this._material = new THREE.MeshBasicMaterial({
            color: this.options.color,
            wireframe: this.options.wireframe
        });
        
        this._sphereGeometry = new THREE.SphereGeometry(1);
        this._boxGeometry = new THREE.BoxGeometry(1, 1, 1);
        this._planeGeometry = new THREE.PlaneGeometry(10, 10, 10, 10);
        this._cylinderGeometry = new THREE.CylinderGeometry(1, 1, 1, 32);
    }
    
    update() {
        // Удаляем все существующие меши
        this._meshes.forEach(mesh => {
            this.scene.remove(mesh);
        });
        
        this._meshes.length = 0;
        
        // Для каждого тела в мире создаем отладочный меш
        this.world.bodies.forEach(body => {
            body.shapes.forEach((shape, shapeIndex) => {
                const mesh = this._createDebugMesh(shape);
                
                if (mesh) {
                    // Копируем позицию и поворот из физического тела
                    mesh.position.copy(body.position);
                    mesh.quaternion.copy(body.quaternion);
                    
                    this.scene.add(mesh);
                    this._meshes.push(mesh);
                }
            });
        });
    }
    
    _createDebugMesh(shape) {
        let mesh = null;
        let geometry = null;
        
        switch (shape.type) {
            case CANNON.Shape.types.SPHERE:
                geometry = this._sphereGeometry.clone();
                geometry.scale(shape.radius, shape.radius, shape.radius);
                mesh = new THREE.Mesh(geometry, this._material);
                break;
                
            case CANNON.Shape.types.BOX:
                geometry = this._boxGeometry.clone();
                geometry.scale(
                    shape.halfExtents.x * 2,
                    shape.halfExtents.y * 2,
                    shape.halfExtents.z * 2
                );
                mesh = new THREE.Mesh(geometry, this._material);
                break;
                
            case CANNON.Shape.types.PLANE:
                geometry = this._planeGeometry.clone();
                mesh = new THREE.Mesh(geometry, this._material);
                mesh.scale.set(100, 100, 100);
                break;
                
            case CANNON.Shape.types.CYLINDER:
                geometry = this._cylinderGeometry.clone();
                geometry.scale(shape.radiusTop, shape.height, shape.radiusBottom);
                mesh = new THREE.Mesh(geometry, this._material);
                break;
        }
        
        return mesh;
    }
}