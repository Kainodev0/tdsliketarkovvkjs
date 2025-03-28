/**
 * Определения типов предметов для системы инвентаря
 */

// Перечисление типов предметов
export const ItemType = {
    WEAPON: 'weapon',
    AMMO: 'ammo',
    MEDICAL: 'medical',
    ARMOR: 'armor',
    RESOURCE: 'resource',
    VALUABLE: 'valuable'
  };
  
  // Базовые характеристики предметов (будут загружаться из JSON)
  export const itemTypes = {
    // Оружие
    pistol: {
      name: 'Пистолет',
      type: ItemType.WEAPON,
      description: 'Стандартный 9мм пистолет',
      weight: 1.0,
      size: { width: 2, height: 1 },
      value: 400,
      weaponType: 'pistol',
      sprite: 'pistol',
      stackable: false
    },
    shotgun: {
      name: 'Дробовик',
      type: ItemType.WEAPON,
      description: 'Дробовик 12 калибра',
      weight: 3.0,
      size: { width: 3, height: 1 },
      value: 800,
      weaponType: 'shotgun',
      sprite: 'shotgun',
      stackable: false
    },
    
    // Боеприпасы
    ammo_9mm: {
      name: 'Патроны 9мм',
      type: ItemType.AMMO,
      description: 'Стандартные 9мм патроны',
      weight: 0.01,
      size: { width: 1, height: 1 },
      value: 5,
      ammoType: '9mm',
      ammoCount: 30,
      sprite: 'ammo_9mm',
      stackable: true,
      maxStack: 300
    },
    ammo_12gauge: {
      name: 'Патроны 12 калибра',
      type: ItemType.AMMO,
      description: 'Патроны для дробовика',
      weight: 0.03,
      size: { width: 1, height: 1 },
      value: 10,
      ammoType: '12gauge',
      ammoCount: 25,
      sprite: 'ammo_12gauge',
      stackable: true,
      maxStack: 150
    },
    
    // Медицина
    medkit: {
      name: 'Аптечка',
      type: ItemType.MEDICAL,
      description: 'Восстанавливает здоровье',
      weight: 0.5,
      size: { width: 1, height: 1 },
      value: 300,
      healAmount: 50,
      useTime: 3,
      sprite: 'medkit',
      stackable: true,
      maxStack: 5
    },
    bandage: {
      name: 'Бинт',
      type: ItemType.MEDICAL,
      description: 'Останавливает кровотечение',
      weight: 0.1,
      size: { width: 1, height: 1 },
      value: 50,
      healAmount: 15,
      useTime: 1.5,
      sprite: 'bandage',
      stackable: true,
      maxStack: 10
    },
    
    // Броня
    bodyArmor: {
      name: 'Бронежилет',
      type: ItemType.ARMOR,
      description: 'Защищает от пуль',
      weight: 5.0,
      size: { width: 2, height: 2 },
      value: 1000,
      protection: 0.3, // 30% снижение урона
      durability: 100,
      sprite: 'body_armor',
      stackable: false
    },
    
    // Ресурсы для крафта
    metal: {
      name: 'Металлические части',
      type: ItemType.RESOURCE,
      description: 'Используется для крафта',
      weight: 0.2,
      size: { width: 1, height: 1 },
      value: 15,
      sprite: 'metal',
      stackable: true,
      maxStack: 50
    },
    
    // Ценности для продажи
    goldwatch: {
      name: 'Золотые часы',
      type: ItemType.VALUABLE,
      description: 'Можно продать торговцу',
      weight: 0.1,
      size: { width: 1, height: 1 },
      value: 500,
      sprite: 'goldwatch',
      stackable: false
    }
  };
  
  /**
   * Возвращает цвет фона для предмета в зависимости от его типа
   * @param {string} itemType - Тип предмета
   * @returns {string} - Цвет в формате rgba
   */
  export function getItemColor(itemType) {
    switch (itemType) {
      case ItemType.WEAPON:
        return 'rgba(178, 34, 34, 0.7)'; // красный
      case ItemType.AMMO:
        return 'rgba(255, 165, 0, 0.7)'; // оранжевый
      case ItemType.MEDICAL:
        return 'rgba(60, 179, 113, 0.7)'; // зеленый
      case ItemType.ARMOR:
        return 'rgba(70, 130, 180, 0.7)'; // стальной синий
      case ItemType.RESOURCE:
        return 'rgba(128, 128, 128, 0.7)'; // серый
      case ItemType.VALUABLE:
        return 'rgba(255, 215, 0, 0.7)'; // золотой
      default:
        return 'rgba(47, 79, 79, 0.7)'; // темно-серый
    }
  }