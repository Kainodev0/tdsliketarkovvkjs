// src/systems/visionSystem.js
// Реализация системы видимости на основе рейкастинга, как в Nox

import { map } from '../engine/map.js';
import { debug } from '../engine/debugger.js';

// Глобальные переменные для кеширования
let visionCache = null;
let lastPlayerX = null;
let lastPlayerY = null;
let lastPlayerAngle = null;

// Константы
const RAY_COUNT = 120;         // Количество лучей для рейкастинга
const VIEW_DISTANCE = 500;     // Максимальная дистанция видимости
const FOV_ANGLE = Math.PI / 1.5; // Угол обзора (120 градусов)
const CLOSE_VISION_RADIUS = 50; // Радиус ближнего зрения (всегда видимая область)

/**
 * Вычисляет пересечение луча с отрезком
 * @param {Object} rayOrigin - Начальная точка луча {x, y}
 * @param {Object} rayDirection - Направление луча {x, y}
 * @param {Object} segStart - Начальная точка отрезка {x, y}
 * @param {Object} segEnd - Конечная точка отрезка {x, y}
 * @returns {Object|null} - Точка пересечения {x, y, distance} или null
 */
function raySegmentIntersection(rayOrigin, rayDirection, segStart, segEnd) {
    // Вектор отрезка
    const segDirX = segEnd.x - segStart.x;
    const segDirY = segEnd.y - segStart.y;
    
    // Определитель для проверки параллельности
    const det = rayDirection.x * segDirY - rayDirection.y * segDirX;
    
    // Если лучи параллельны или почти параллельны, нет пересечения
    if (Math.abs(det) < 0.0001) return null;
    
    // Векторы от начала луча до начала отрезка
    const s1 = (rayDirection.x * (segStart.y - rayOrigin.y) - rayDirection.y * (segStart.x - rayOrigin.x)) / det;
    const s2 = (segDirX * (segStart.y - rayOrigin.y) - segDirY * (segStart.x - rayOrigin.x)) / det;
    
    // Если s1 в пределах [0, 1] и s2 > 0, есть пересечение
    if (s1 >= 0 && s1 <= 1 && s2 >= 0) {
        const intersectionX = segStart.x + s1 * segDirX;
        const intersectionY = segStart.y + s1 * segDirY;
        
        // Расстояние от начальной точки луча до точки пересечения
        const distance = Math.sqrt(
            Math.pow(intersectionX - rayOrigin.x, 2) + 
            Math.pow(intersectionY - rayOrigin.y, 2)
        );
        
        return {
            x: intersectionX,
            y: intersectionY,
            distance: distance
        };
    }
    
    return null;
}

/**
 * Вычисляет пересечение луча со стеной
 * @param {Object} rayOrigin - Начальная точка луча {x, y}
 * @param {Object} rayDirection - Направление луча {x, y}
 * @param {Object} wall - Стена {x, y, w, h}
 * @returns {Object|null} - Ближайшая точка пересечения {x, y, distance} или null
 */
function rayWallIntersection(rayOrigin, rayDirection, wall) {
    // Создаем 4 отрезка для сторон стены
    const segments = [
        // Верхняя сторона
        { start: {x: wall.x, y: wall.y}, end: {x: wall.x + wall.w, y: wall.y} },
        // Правая сторона
        { start: {x: wall.x + wall.w, y: wall.y}, end: {x: wall.x + wall.w, y: wall.y + wall.h} },
        // Нижняя сторона
        { start: {x: wall.x, y: wall.y + wall.h}, end: {x: wall.x + wall.w, y: wall.y + wall.h} },
        // Левая сторона
        { start: {x: wall.x, y: wall.y}, end: {x: wall.x, y: wall.y + wall.h} }
    ];
    
    let closestIntersection = null;
    let minDistance = Infinity;
    
    // Проверяем пересечение с каждой стороной
    for (const segment of segments) {
        const intersection = raySegmentIntersection(
            rayOrigin, rayDirection, 
            segment.start, segment.end
        );
        
        // Обновляем ближайшее пересечение
        if (intersection && intersection.distance < minDistance) {
            minDistance = intersection.distance;
            closestIntersection = intersection;
        }
    }
    
    return closestIntersection;
}

/**
 * Создает данные о видимости для игрока с использованием рейкастинга
 * @param {Object} player - Объект игрока
 * @param {Object} customMap - Пользовательская карта (опционально)
 * @param {number} viewDistance - Максимальная дистанция видимости
 * @param {number} fovAngle - Угол обзора в радианах
 * @returns {Object} - Данные о видимости
 */
export function getVisibleTiles(player, customMap, viewDistance = VIEW_DISTANCE, fovAngle = FOV_ANGLE) {
    // Используем любую доступную карту
    const currentMap = customMap || map || window.map || { walls: [] };
    
    // Базовые проверки
    if (!player) {
        debug("Ошибка: игрок не определен", "error");
        return { points: [], coneTip: { x: 0, y: 0 }, angle: 0, coneAngle: 0, viewDistance: 0 };
    }

    // Получаем координаты игрока
    const playerX = player.x || 0;
    const playerY = player.y || 0;
    const playerAngle = player.angle || 0;
    
    // Проверяем кеш (если позиция не изменилась, используем кеш)
    if (visionCache && 
        playerX === lastPlayerX && 
        playerY === lastPlayerY && 
        playerAngle === lastPlayerAngle) {
        return visionCache;
    }
    
    // Начальная точка (позиция игрока)
    const origin = { x: playerX, y: playerY };
    
    // Список видимых точек (начинаем с позиции игрока)
    const visiblePoints = [origin];
    
    // Генерируем лучи вокруг игрока
    const halfFov = fovAngle / 2;
    
    // Создаем лучи по углу обзора
    for (let i = 0; i <= RAY_COUNT; i++) {
        // Угол каждого луча (от -halfFov до +halfFov относительно направления игрока)
        const rayAngle = playerAngle - halfFov + (fovAngle * i / RAY_COUNT);
        
        // Направление луча (нормализованный вектор)
        const direction = {
            x: Math.cos(rayAngle),
            y: Math.sin(rayAngle)
        };

        // Конечная точка луча по умолчанию (если не пересекает стены)
        let endPoint = {
            x: playerX + direction.x * viewDistance,
            y: playerY + direction.y * viewDistance,
            distance: viewDistance
        };
        
        // Проверяем пересечения со всеми стенами
        if (currentMap.walls && Array.isArray(currentMap.walls)) {
            for (const wall of currentMap.walls) {
                const intersection = rayWallIntersection(origin, direction, wall);
                
                // Если нашли пересечение и оно ближе текущего, обновляем конечную точку
                if (intersection && intersection.distance < endPoint.distance) {
                    endPoint = intersection;
                }
            }
        }
        
        // Добавляем конечную точку луча в список видимых точек
        visiblePoints.push(endPoint);
    }
    
    // Создаем структуру данных для видимости
    const visibilityData = {
        coneTip: origin,
        points: visiblePoints,
        angle: playerAngle,
        coneAngle: fovAngle,
        viewDistance: viewDistance,
        rayCount: RAY_COUNT,
        closeVisionRadius: CLOSE_VISION_RADIUS,
        timestamp: Date.now()
    };
    
    // Сохраняем кеш
    visionCache = visibilityData;
    lastPlayerX = playerX;
    lastPlayerY = playerY;
    lastPlayerAngle = playerAngle;
    
    return visibilityData;
}

/**
 * Проверяет, находится ли точка внутри многоугольника (полигона видимости)
 * @param {Object} point - Проверяемая точка {x, y}
 * @param {Array} polygon - Массив точек многоугольника [{x, y}, ...]
 * @returns {boolean} - Находится ли точка внутри многоугольника
 */
function isPointInPolygon(point, polygon) {
    if (!polygon || polygon.length < 3) return false;
    
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x;
        const yi = polygon[i].y;
        const xj = polygon[j].x;
        const yj = polygon[j].y;
        
        const intersect = ((yi > point.y) !== (yj > point.y)) &&
            (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
        
        if (intersect) inside = !inside;
    }
    
    return inside;
}

/**
 * Проверяет, видна ли точка игроку через рейкастинг
 * @param {Object} point - Проверяемая точка {x, y}
 * @param {Object} visibilityData - Данные о видимости
 * @returns {boolean} - Видна ли точка
 */
export function isPointVisible(point, visibilityData) {
    // Если нет данных о видимости, считаем все видимым
    if (!visibilityData || !visibilityData.points || visibilityData.points.length < 3) {
        return true;
    }
    
    const playerX = visibilityData.coneTip.x;
    const playerY = visibilityData.coneTip.y;
    
    // Если точка в радиусе ближнего зрения - всегда видима
    const dx = point.x - playerX;
    const dy = point.y - playerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < visibilityData.closeVisionRadius) {
        return true;
    }
    
    // Если точка дальше максимальной дистанции - не видна
    if (distance > visibilityData.viewDistance) {
        return false;
    }
    
    // Проверяем, находится ли точка в угле обзора
    const angle = Math.atan2(dy, dx);
    const playerAngle = visibilityData.angle;
    
    // Нормализуем углы для корректного сравнения
    const normalizeAngle = (a) => {
        while (a < -Math.PI) a += 2 * Math.PI;
        while (a > Math.PI) a -= 2 * Math.PI;
        return a;
    };
    
    const angleDiff = Math.abs(normalizeAngle(angle - playerAngle));
    const halfCone = visibilityData.coneAngle / 2;
    
    if (angleDiff > halfCone) {
        return false;
    }
    
    // Проверяем, находится ли точка внутри полигона видимости
    return isPointInPolygon(point, visibilityData.points);
}

/**
 * Проверяет, находится ли точка экрана в конусе видимости
 * @param {number} x - X-координата на экране
 * @param {number} y - Y-координата на экране
 * @param {Object} visibilityData - Данные о видимости
 * @param {number} cameraOffsetX - Смещение камеры по X
 * @param {number} cameraOffsetY - Смещение камеры по Y
 * @returns {boolean} - Находится ли точка в конусе видимости
 */
export function isScreenPointInVisionCone(x, y, visibilityData, cameraOffsetX, cameraOffsetY) {
    // Переводим точку в мировые координаты
    const worldX = x + cameraOffsetX;
    const worldY = y + cameraOffsetY;
    
    // Используем существующую функцию проверки
    return isPointVisible({x: worldX, y: worldY}, visibilityData);
}

/**
 * Сбрасывает кеш видимости
 */
export function invalidateVisionCache() {
    visionCache = null;
}

/**
 * Отрисовка затемнения для областей вне поля зрения
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования
 * @param {Object} visibilityData - Данные о видимости
 */
export function drawFogOfWar(ctx, visibilityData) {
    if (!visibilityData || !visibilityData.points || visibilityData.points.length < 3) {
        return;
    }
    
    ctx.save();
    
    // Создаем затемнение для всего экрана
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Вырезаем из затемнения область видимости
    ctx.globalCompositeOperation = 'destination-out';
    
    // Рисуем полигон видимости
    ctx.beginPath();
    ctx.moveTo(visibilityData.points[0].x, visibilityData.points[0].y);
    
    for (let i = 1; i < visibilityData.points.length; i++) {
        ctx.lineTo(visibilityData.points[i].x, visibilityData.points[i].y);
    }
    
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
}