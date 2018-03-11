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
import inventoryTabGfx from './img/inventory_tab.png';
import skillTabGfx from './img/skill_tab.png';
import buildingTabGfx from './img/building_tab.png';
import inventoryPanelGfx from './img/inventory_panel.png';
import skillPanelGfx from './img/skill_panel.png';
import buildingPanelGfx from './img/building_panel.png';
import tooltipGfx from './img/tooltip.png';

// Buildings
import beaconGfx from './img/buildings/beacon.png';
import campfireGfx from './img/buildings/campfire.png';
import mineGoldGfx from './img/buildings/mine_gold.png';
import mineStoneGfx from './img/buildings/mine_stone.png';
import ovenGfx from './img/buildings/oven.png';
import papermillGfx from './img/buildings/papermill.png';
import tentGfx from './img/buildings/tent.png';
import wellGfx from './img/buildings/well.png';

// Skills
import buffBuildGfx from './img/skills/buffbuild.png';
import buffChopGfx from './img/skills/buffchopgather.png';
import buffWalkGfx from './img/skills/buffwalk.png';
import buildBeaconGfx from './img/skills/build_beacon.png';
import buildFireGfx from './img/skills/build_fire.png';
import buildGoldMineGfx from './img/skills/build_mine_gold.png';
import buildStoneMineGfx from './img/skills/build_mine_stone.png';
import buildOvenGfx from './img/skills/build_oven.png';
import buildPapermillGfx from './img/skills/build_papermill.png';
import buildTentGfx from './img/skills/build_tent.png';
import buildWellGfx from './img/skills/build_well.png';
import chopDash1Gfx from './img/skills/chopdash1.png';
import chopDash2Gfx from './img/skills/chopdash2.png';
import chopFast1Gfx from './img/skills/chopfast1.png';
import chopFast2Gfx from './img/skills/chopfast2.png';
import chopFast3Gfx from './img/skills/chopfast3.png';
import emoteGfx from './img/skills/emote.png';
import emoteMoreGfx from './img/skills/emoteMore.png';
import gatherClothGfx from './img/skills/gather_cloth.png';
import gatherGemGfx from './img/skills/gather_gem.png';
import gatherMagicGfx from './img/skills/gather_magic.png';
import gatherRopeGfx from './img/skills/gather_rope.png';
import trackBuildingGfx from './img/skills/track_building.png';
import trackPlayerGfx from './img/skills/track_player.png';

// Moved this out to its own file so that it doesn't clog up index.js
//  Later on, maybe this could be a class that only loads what is necessary instead of everything ever.
//  Also, maybe a lot of these graphics should be in a sprite sheet. But later.
export function LoadGraphics(sceneRef) {
  sceneRef.load.image('tree', treeGfx);
  sceneRef.load.image('stump', stumpGfx);

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
  sceneRef.load.image('inventoryPanel', inventoryPanelGfx);
  sceneRef.load.image('skillPanel', skillPanelGfx);
  sceneRef.load.image('buildingPanel', buildingPanelGfx);
  sceneRef.load.image('tooltip', tooltipGfx);

  sceneRef.load.spritesheet('grass', grassGfx, { frameWidth: 64, frameHeight: 64 });
  sceneRef.load.spritesheet('resources', resourceGfx, { frameWidth: 32, frameHeight: 32 });
  
  sceneRef.load.spritesheet('blueGob', blueGobGfx, { frameWidth: 64, frameHeight: 64, endFrame: 38*8 });
  sceneRef.load.spritesheet('greenGob', greenGobGfx, { frameWidth: 64, frameHeight: 64, endFrame: 38*8 });
  sceneRef.load.spritesheet('redGob', redGobGfx, { frameWidth: 64, frameHeight: 64, endFrame: 38*8 });
  sceneRef.load.spritesheet('yellowGob', yellowGobGfx, { frameWidth: 64, frameHeight: 64, endFrame: 38*8 });

  sceneRef.load.image('skill_buffBuild', buffBuildGfx);
  sceneRef.load.image('skill_buffChop', buffChopGfx);
  sceneRef.load.image('skill_buffWalk', buffWalkGfx);
  sceneRef.load.image('skill_buildBeacon', buildBeaconGfx);
  sceneRef.load.image('skill_buildFire', buildFireGfx);
  sceneRef.load.image('skill_buildGoldMine', buildGoldMineGfx);
  sceneRef.load.image('skill_buildStoneMine', buildStoneMineGfx);
  sceneRef.load.image('skill_buildOven', buildOvenGfx);
  sceneRef.load.image('skill_buildPapermill', buildPapermillGfx);
  sceneRef.load.image('skill_buildTent', buildTentGfx);
  sceneRef.load.image('skill_buildWell', buildWellGfx);
  sceneRef.load.image('skill_chopDash1', chopDash1Gfx);
  sceneRef.load.image('skill_chopDash2', chopDash2Gfx);
  sceneRef.load.image('skill_chopFast1', chopFast1Gfx);
  sceneRef.load.image('skill_chopFast2', chopFast2Gfx);
  sceneRef.load.image('skill_chopFast3', chopFast3Gfx);
  sceneRef.load.image('skill_emote', emoteGfx);
  sceneRef.load.image('skill_emoteMore', emoteMoreGfx);
  sceneRef.load.image('skill_gatherCloth', gatherClothGfx);
  sceneRef.load.image('skill_gatherGem', gatherGemGfx);
  sceneRef.load.image('skill_gatherMagic', gatherMagicGfx);
  sceneRef.load.image('skill_gatherRope', gatherRopeGfx);
  sceneRef.load.image('skill_trackBuilding', trackBuildingGfx);
  sceneRef.load.image('skill_trackPlayer', trackPlayerGfx);
}