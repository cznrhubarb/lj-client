// Gobbos
import blueGobGfx from './img/goblin_lumberjack_blue.png';
import greenGobGfx from './img/goblin_lumberjack_green.png';
import redGobGfx from './img/goblin_lumberjack_red.png';
import yellowGobGfx from './img/goblin_lumberjack_yellow.png';

// Terrain stuff
import treeGfx from './img/tree.png';
import stumpGfx from './img/stump.png';
import grassGfx from './img/grasses.png';

// Resources
import resourceGfx from './img/resource_icons.png';

// Tabby stuff
import backpackGfx from './img/backpack.png';
import axeGfx from './img/axe.png';
import buildingGfx from './img/building.png';
import xGfx from './img/x.png';
import inventoryTabGfx from './img/inventory_tab.png';
import skillTabGfx from './img/skill_tab.png';
import buildingTabGfx from './img/building_tab.png';

// Buildings
import beaconGfx from './img/buildings/beacon.png';
import campfireGfx from './img/buildings/campfire.png';
import mineGoldGfx from './img/buildings/mine_gold.png';
import mineStoneGfx from './img/buildings/mine_stone.png';
import ovenGfx from './img/buildings/oven.png';
import papermillGfx from './img/buildings/papermill.png';
import tentGfx from './img/buildings/tent.png';
import wellGfx from './img/buildings/well.png';

// Moved this out to its own file so that it doesn't clog up index.js
//  Later on, maybe this could be a class that only loads what is necessary instead of everything ever.
//  Also, maybe a lot of these graphics should be in a sprite sheet. But later.
export function LoadGraphics(sceneRef) {
  sceneRef.load.image('tree', treeGfx);
  sceneRef.load.image('stump', stumpGfx);
  sceneRef.load.image('backpack', backpackGfx);
  sceneRef.load.image('axe', axeGfx);
  sceneRef.load.image('building', buildingGfx);
  sceneRef.load.image('x', xGfx);

  sceneRef.load.image('beacon', beaconGfx);
  sceneRef.load.image('campfire', campfireGfx);
  sceneRef.load.image('mine_gold', mineGoldGfx);
  sceneRef.load.image('mine_stone', mineStoneGfx);
  sceneRef.load.image('oven', ovenGfx);
  sceneRef.load.image('papermill', papermillGfx);
  sceneRef.load.image('tent', tentGfx);
  sceneRef.load.image('well', wellGfx);

  sceneRef.load.image('inventoryTab', inventoryTabGfx);
  sceneRef.load.image('skillTab', skillTabGfx);
  sceneRef.load.image('buildingTab', buildingTabGfx);

  sceneRef.load.spritesheet('grass', grassGfx, { frameWidth: 64, frameHeight: 64 });
  sceneRef.load.spritesheet('resources', resourceGfx, { frameWidth: 32, frameHeight: 32 });
  
  sceneRef.load.spritesheet('blueGob', blueGobGfx, { frameWidth: 64, frameHeight: 64, endFrame: 38*8 });
  sceneRef.load.spritesheet('greenGob', greenGobGfx, { frameWidth: 64, frameHeight: 64, endFrame: 38*8 });
  sceneRef.load.spritesheet('redGob', redGobGfx, { frameWidth: 64, frameHeight: 64, endFrame: 38*8 });
  sceneRef.load.spritesheet('yellowGob', yellowGobGfx, { frameWidth: 64, frameHeight: 64, endFrame: 38*8 });
}