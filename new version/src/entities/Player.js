// src/entities/Player.js
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Entity } from './Entity.js';

export class Player extends Entity {
    constructor(game, options = {}) {
        super(game);
        
        // Параметры игрока
        this.options = Object.assign({
            position: new THREE.Vector3(400, 1, 300),
            radius: 15,
            height: 40,
            speed: 200,
            turnSpeed: 5,
            health: 100,
            maxHealth: 100
        }, options);
        
        // Состояние игрока
        this.state = {
            isMoving: false,
            isSprinting: false,
            isAiming: false,
            health: this.options.health,
            stamina: 100,
            inventory: null
        };
        
        // Текущее оружие и снаряжение
        this.equipment = {
            weapon: null,
            armor: null
        };
        
        this.rotation = 0; // Угол поворота в радианах
        this.velocity = new THREE.Vector3();
        
        // Настройка 3D модели и физики
        this.setupMesh();
        this.setupPhysics();
        
        // Инициализация инвентаря
        this.initInventory();
    }
    
    setupMesh() {
        // Создаем группу для всех частей игрока
        this.mesh = new THREE.Group();
        
        // Тело игрока (цилиндр)
        const geometry = new THREE.CylinderGeometry(
            this.options.radius, 
            this.options.radius,
            this.options.height, 
            16
        );
        
        const material = new THREE.MeshLambertMaterial({
            color: 0x4af, // Синий цвет игрока
            flatShading: true
        });
        
        this.bodyMesh = new THREE.Mesh(geometry, material);
        this.bodyMesh.position.y = this.options.height / 2;
        this.mesh.add(this.bodyMesh);
        
        // Указатель направления (стрелка)
        const arrowGeometry = new THREE.ConeGeometry(5, 10, 8);
        const arrowMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        this.arrowMesh = new THREE.Mesh(arrowGeometry, arrowMaterial);
        this.arrowMesh.rotation.x = Math.PI / 2;
        this.arrowMesh.position.set(this.options.radius + 5, this.options.height / 2, 0);
        this.mesh.add(this.arrowMesh);
        
        // Добавляем источник света от игрока (фонарик)
        this.flashlight = new THREE.SpotLight(0xffffee, 1, 300, Math.PI / 6, 0.5, 1);
        this.flashlight.position.set(0, this.options.height, 0);
        this.flashlight.target.position.set(this.options.radius + 50, 0, 0);
        this.mesh.add(this.flashlight);
        this.mesh.add(this.flashlight.target);
        
        // Устанавливаем начальную позицию
        this.mesh.position.copy(this.options.position);
        
        // Добавляем на сцену
        this.game.scene.add(this.mesh);
    }
    
    setupPhysics() {
        // Создаем физическое тело для игрока
        this.body = this.game.physicsWorld.createPlayerBody(
            this.options.position.x,
            this.options.position.z,
            this.options.radius
        );
        
        // Сохраняем связь меша и физического тела
        this.game.physicsWorld.addBody(this.body, this.mesh);
        
        // Коллбэк для обработки столкновений
        this.body.addEventListener('collide', (event) => {
            this.handleCollision(event);
        });
    }
    
    initInventory() {
        // Инициализируем инвентарь игрока
        if (this.game.inventorySystem) {
            this.state.inventory = this.game.inventorySystem.createInventory(10, 10);
        }
    }
    
    update(deltaTime) {
        // Обновляем состояние игрока
        this.updateMovement(deltaTime);
        this.updateAiming();
        this.updateEquipment();
        
        // Обновляем мировую матрицу для корректных расчетов
        this.mesh.updateMatrixWorld();
    }
    
    updateMovement(deltaTime) {
        const inputManager = this.game.inputManager;
        if (!inputManager) return;
        
        // Получаем входные данные
        const moveForward = inputManager.isKeyPressed('w') || inputManager.isKeyPressed('ArrowUp');
        const moveBackward = inputManager.isKeyPressed('s') || inputManager.isKeyPressed('ArrowDown');
        const moveLeft = inputManager.isKeyPressed('a') || inputManager.isKeyPressed('ArrowLeft');
        const moveRight = inputManager.isKeyPressed('d') || inputManager.isKeyPressed('ArrowRight');
        this.state.isSprinting = inputManager.isKeyPressed('Shift');
        
        // Определяем направление движения
        let moveX = 0;
        let moveZ = 0;
        
        if (moveForward) moveZ -= 1;
        if (moveBackward) moveZ += 1;
        if (moveLeft) moveX -= 1;
        if (moveRight) moveX += 1;
        
        // Если есть движение
        if (moveX !== 0 || moveZ !== 0) {
            this.state.isMoving = true;
            
            // Нормализация для диагонального движения
            const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
            moveX /= length;
            moveZ /= length;
            
            // Определяем скорость в зависимости от спринта
            const currentSpeed = this.state.isSprinting ? 
                this.options.speed * 1.5 : 
                this.options.speed;
            
            // Применяем силу к физическому телу
            const impulse = new CANNON.Vec3(
                moveX * currentSpeed * deltaTime,
                0,
                moveZ * currentSpeed * deltaTime
            );
            
            this.body.applyImpulse(impulse);
        } else {
            this.state.isMoving = false;
        }
        
        // Обновляем поворот в направлении движения, если игрок движется
        if (this.state.isMoving) {
            const targetAngle = Math.atan2(moveZ, moveX);
            
            // Плавный поворот к целевому углу
            let angleDiff = targetAngle - this.rotation;
            
            // Нормализация разницы углов
            if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            
            // Плавный поворот
            this.rotation += angleDiff * this.options.turnSpeed * deltaTime;
            
            // Нормализация угла
            if (this.rotation > Math.PI) this.rotation -= Math.PI * 2;
            if (this.rotation < -Math.PI) this.rotation += Math.PI * 2;
            
            // Применяем поворот к мешу
            this.mesh.rotation.y = this.rotation;
        }
        
        // Обновляем позицию меша из физического тела
        const position = this.body.position;
        this.mesh.position.set(position.x, 0, position.z);
    }
    
    updateAiming() {
        const inputManager = this.game.inputManager;
        if (!inputManager) return;
        
        // Проверяем, нажата ли правая кнопка мыши для прицеливания
        this.state.isAiming = inputManager.isMouseButtonPressed(2); // Правая кнопка мыши
        
        // Получаем позицию мыши для прицеливания
        const mousePosition = inputManager.getMouseWorldPosition();
        
        if (mousePosition) {
            // Рассчитываем угол поворота игрока к указателю мыши
            const dx = mousePosition.x - this.mesh.position.x;
            const dz = mousePosition.z - this.mesh.position.z;
            
            this.rotation = Math.atan2(dz, dx);
            this.mesh.rotation.y = this.rotation;
            
            // Направляем фонарик в ту же сторону
            this.flashlight.target.position.set(
                Math.cos(this.rotation) * 50,
                0,
                Math.sin(this.rotation) * 50
            ).add(this.mesh.position);
        }
        
        // Если игрок прицеливается, увеличиваем яркость фонарика
        this.flashlight.intensity = this.state.isAiming ? 2 : 1;
        this.flashlight.angle = this.state.isAiming ? Math.PI / 8 : Math.PI / 6;
        this.flashlight.distance = this.state.isAiming ? 400 : 300;
    }
    
    updateEquipment() {
        // Обновляем оружие, если есть
        if (this.equipment.weapon) {
            // Позиционируем оружие относительно игрока
            const weaponPosition = new THREE.Vector3(
                this.options.radius * 0.8,
                this.options.height * 0.5,
                0
            );
            
            weaponPosition.applyQuaternion(this.mesh.quaternion);
            weaponPosition.add(this.mesh.position);
            
            this.equipment.weapon.position.copy(weaponPosition);
            this.equipment.weapon.rotation.y = this.rotation;
            
            // Обновляем состояние оружия
            if (this.equipment.weapon.update) {
                this.equipment.weapon.update();
            }
        }
    }
    
    handleCollision(event) {
        // Обработка столкновений
        const collidingBody = event.body;
        
        // Проверяем тип объекта, с которым столкнулись
        if (collidingBody.userData && collidingBody.userData.type) {
            switch (collidingBody.userData.type) {
                case 'item':
                    this.pickupItem(collidingBody.userData.item);
                    break;
                    
                case 'projectile':
                    this.takeDamage(collidingBody.userData.damage || 10);
                    break;
                    
                case 'door':
                    this.interactWithDoor(collidingBody.userData.door);
                    break;
            }
        }
    }
    
    takeDamage(amount) {
        // Применяем защиту брони, если есть
        let damageReduction = 0;
        if (this.equipment.armor) {
            damageReduction = this.equipment.armor.protection || 0;
        }
        
        // Рассчитываем итоговый урон
        const actualDamage = amount * (1 - damageReduction);
        
        // Уменьшаем здоровье
        this.state.health = Math.max(0, this.state.health - actualDamage);
        
        // Визуальный эффект получения урона
        this.showDamageEffect();
        
        // Если здоровье кончилось, игрок умирает
        if (this.state.health <= 0) {
            this.die();
        }
    }
    
    showDamageEffect() {
        // Простой визуальный эффект при получении урона (мигание красным)
        const originalColor = this.bodyMesh.material.color.clone();
        this.bodyMesh.material.color.set(0xff0000);
        
        setTimeout(() => {
            this.bodyMesh.material.color.copy(originalColor);
        }, 150);
    }
    
    die() {
        console.log('Player died!');
        
        // TODO: Реализация смерти игрока (спавн лута, переход к экрану смерти и т.д.)
        
        // Вызываем событие смерти для обработки в других системах
        if (this.game.eventSystem) {
            this.game.eventSystem.trigger('playerDeath', this);
        }
    }
    
    pickupItem(item) {
        if (!item || !this.state.inventory) return;
        
        // Пытаемся добавить предмет в инвентарь
        const added = this.game.inventorySystem.addItemToInventory(
            this.state.inventory,
            item
        );
        
        if (added) {
            console.log(`Picked up: ${item.name}`);
            
            // Удаляем предмет из мира, если он был поднят
            item.removeFromWorld();
            
            // Уведомляем игрока (UI)
            this.game.uiManager.showPickupNotification(item);
        } else {
            console.log('Inventory is full!');
            this.game.uiManager.showMessage('Инвентарь полон!');
        }
    }
    
    equipWeapon(weapon) {
        // Убираем текущее оружие, если есть
        if (this.equipment.weapon) {
            this.unequipWeapon();
        }
        
        // Устанавливаем новое оружие
        this.equipment.weapon = weapon;
        
        // Настраиваем позицию и поворот относительно игрока
        weapon.position.copy(this.mesh.position);
        weapon.rotation.y = this.rotation;
        
        // Добавляем оружие на сцену
        this.game.scene.add(weapon);
        
        console.log(`Equipped: ${weapon.name}`);
    }
    
    unequipWeapon() {
        if (!this.equipment.weapon) return;
        
        // Удаляем оружие со сцены
        this.game.scene.remove(this.equipment.weapon);
        
        // Убираем ссылку
        this.equipment.weapon = null;
    }
    
    useItem(item) {
        if (!item) return false;
        
        // Обрабатываем разные типы предметов
        switch (item.type) {
            case 'medical':
                return this.useMedicalItem(item);
                
            case 'weapon':
                return this.equipWeaponFromInventory(item);
                
            case 'armor':
                return this.equipArmorFromInventory(item);
                
            default:
                console.log(`Cannot use item: ${item.name}`);
                return false;
        }
    }
    
    useMedicalItem(item) {
        // Проверяем, нужно ли лечение
        if (this.state.health >= this.options.maxHealth) {
            console.log('Health is already full');
            return false;
        }
        
        // Применяем лечение
        const healAmount = item.healAmount || 0;
        this.state.health = Math.min(
            this.options.maxHealth,
            this.state.health + healAmount
        );
        
        console.log(`Used ${item.name}. Health: ${this.state.health}`);
        
        // Показываем эффект лечения
        this.showHealEffect();
        
        return true;
    }
    
    showHealEffect() {
        // Простой визуальный эффект лечения (мигание зеленым)
        const originalColor = this.bodyMesh.material.color.clone();
        this.bodyMesh.material.color.set(0x00ff00);
        
        setTimeout(() => {
            this.bodyMesh.material.color.copy(originalColor);
        }, 150);
    }
    
    // Геттеры для удобного доступа
    get position() {
        return this.mesh.position;
    }
    
    get direction() {
        return new THREE.Vector3(
            Math.cos(this.rotation),
            0,
            Math.sin(this.rotation)
        );
    }
}