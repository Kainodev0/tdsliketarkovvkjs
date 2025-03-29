// src/systems/visionSystem.js
// Fixed implementation for the vision system

import { map } from '../engine/map.js';
import { debug } from '../engine/debugger.js';

// Global variables for caching
let visionCache = null;
let lastPlayerX = null;
let lastPlayerY = null;
let lastPlayerAngle = null;

/**
 * Creates visibility data for the player
 */
export function getVisibleTiles(player, customMap, viewDistance = 500, coneAngle = 2.0) {
  // Use any available map
  const currentMap = customMap || map || { walls: [] };
  
  // Basic checks
  if (!player) {
    debug("Error: player is not defined", "error");
    return { points: [], coneTip: { x: 0, y: 0 }, angle: 0, coneAngle: 0, viewDistance: 0 };
  }

  // Get player coordinates
  const playerX = player.x || 0;
  const playerY = player.y || 0;
  const playerAngle = player.angle || 0;
  
  // Check cache (if position hasn't changed, use cache)
  if (visionCache && 
      playerX === lastPlayerX && 
      playerY === lastPlayerY && 
      playerAngle === lastPlayerAngle) {
    return visionCache;
  }
  
  // Create a simple visibility cone without raycasting
  const rayCount = 40;
  const halfCone = coneAngle / 2;
  const rayPoints = [];
  
  // Add starting point (player position)
  rayPoints.push({ x: playerX, y: playerY });
  
  // Create rays around in a circle
  for (let i = 0; i <= rayCount; i++) {
    const rayAngle = playerAngle - halfCone + (coneAngle * i / rayCount);
    const x = playerX + Math.cos(rayAngle) * viewDistance;
    const y = playerY + Math.sin(rayAngle) * viewDistance;
    rayPoints.push({ x, y });
  }
  
  // Create visibility data structure
  const visibilityData = {
    coneTip: { x: playerX, y: playerY },
    points: rayPoints,
    angle: playerAngle,
    coneAngle: coneAngle,
    viewDistance: viewDistance
  };
  
  // Save cache
  visionCache = visibilityData;
  lastPlayerX = playerX;
  lastPlayerY = playerY;
  lastPlayerAngle = playerAngle;
  
  return visibilityData;
}

/**
 * Checks if a point is visible to the player
 */
export function isPointVisible(point, visibilityData) {
  // If no visibility data, consider everything visible
  if (!visibilityData || !visibilityData.points || visibilityData.points.length < 3) {
    return true;
  }
  
  const playerX = visibilityData.coneTip.x;
  const playerY = visibilityData.coneTip.y;
  
  // If the point is too close - always visible
  const dx = point.x - playerX;
  const dy = point.y - playerY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance < 50) {
    return true;
  }
  
  // If the point is farther than visibility - not visible
  if (distance > visibilityData.viewDistance) {
    return false;
  }
  
  // Simple check by angle
  const angle = Math.atan2(dy, dx);
  const playerAngle = visibilityData.angle;
  
  // Normalize angles
  const normalizeAngle = (a) => {
    while (a < -Math.PI) a += 2 * Math.PI;
    while (a > Math.PI) a -= 2 * Math.PI;
    return a;
  };
  
  const angleDiff = Math.abs(normalizeAngle(angle) - normalizeAngle(playerAngle));
  const halfCone = visibilityData.coneAngle / 2;
  
  return angleDiff <= halfCone || angleDiff >= (2 * Math.PI - halfCone);
}

/**
 * Applies visibility effect (black and white area outside the cone)
 * This is the fixed function
 */
export function applyVisionEffect(ctx, visibilityData) {
  if (!visibilityData || !visibilityData.points || visibilityData.points.length < 3) {
    return;
  }
  
  // Get canvas dimensions (relative to the viewer, not the world)
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  
  try {
    // Calculate camera position based on player's position
    const cameraOffsetX = visibilityData.coneTip.x - width / 2;
    const cameraOffsetY = visibilityData.coneTip.y - height / 2;
    
    // Create a separate canvas for the mask
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = width;
    maskCanvas.height = height;
    const maskCtx = maskCanvas.getContext('2d');
    
    // Draw vision cone (white on black)
    maskCtx.fillStyle = 'black';
    maskCtx.fillRect(0, 0, width, height);
    
    maskCtx.fillStyle = 'white';
    maskCtx.beginPath();
    
    // Need to transform the points from world coordinates to screen coordinates
    const transformPoint = (point) => {
      return { 
        x: point.x - cameraOffsetX, 
        y: point.y - cameraOffsetY 
      };
    };
    
    const viewCone = visibilityData.points.map(transformPoint);
    
    // Start at the player's transformed position
    const transformedTip = transformPoint(visibilityData.coneTip);
    maskCtx.moveTo(transformedTip.x, transformedTip.y);
    
    // Draw the cone
    for (let i = 1; i < viewCone.length; i++) {
      maskCtx.lineTo(viewCone[i].x, viewCone[i].y);
    }
    
    maskCtx.closePath();
    maskCtx.fill();
    
    // Draw a circle around the player
    maskCtx.beginPath();
    maskCtx.arc(
      transformedTip.x, 
      transformedTip.y, 
      50, // Radius of close vision
      0, 
      Math.PI * 2
    );
    maskCtx.fill();
    
    // Save current canvas state
    ctx.save();
    
    // Create grayscale effect for areas outside vision
    ctx.globalCompositeOperation = 'source-atop';
    
    // Draw a semi-transparent black overlay over the whole screen
    // This will only affect areas outside the vision cone due to the mask
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; // Dark overlay
    ctx.fillRect(0, 0, width, height);
    
    // Apply the mask (clears the vision cone area)
    ctx.globalCompositeOperation = 'destination-out';
    ctx.drawImage(maskCanvas, 0, 0);
    
    // Restore normal operation
    ctx.restore();
    
  } catch (error) {
    debug(`Error in applyVisionEffect: ${error.message}`, "error");
    console.error(error);
  }
}

// Reset cache
export function invalidateVisionCache() {
  visionCache = null;
}