// Gobbos
import blueGobGfx from './img/goblin_lumberjack_blue.png';
import greenGobGfx from './img/goblin_lumberjack_green.png';
import redGobGfx from './img/goblin_lumberjack_red.png';
import yellowGobGfx from './img/goblin_lumberjack_yellow.png';

import chop1Sfx from './snd/chop1.wav';
import chop2Sfx from './snd/chop1.wav';
import chop3Sfx from './snd/chop1.wav';
import skillupSfx from './snd/skillup.wav';
import buyskillSfx from './snd/buyskill.wav';
import tapSfx from './snd/tap.wav';

// Terrain stuff
import grassGfx from './img/grasses.png';

// Resources
import resourceGfx from './img/resource_icons.png';

import terrainAtlasGfx from './img/terrain.png';
import terrainAtlasData from './img/terrain.json';

import skillsAtlasGfx from './img/skills.png';
import skillsAtlasData from './img/skills.json';

import uiAtlasGfx from './img/ui.png';
import uiAtlasData from './img/ui.json';

// Moved this out to its own file so that it doesn't clog up index.js
//  Later on, maybe this could be a class that only loads what is necessary instead of everything ever.
//  Also, maybe a lot of these graphics should be in a sprite sheet. But later.
export function LoadGraphics(sceneRef) {
  sceneRef.load.atlas('terrainAtlas', terrainAtlasGfx, terrainAtlasData);
  sceneRef.load.atlas('skillsAtlas', skillsAtlasGfx, skillsAtlasData);
  sceneRef.load.atlas('uiAtlas', uiAtlasGfx, uiAtlasData);

  sceneRef.load.spritesheet('grass', grassGfx, { frameWidth: 64, frameHeight: 64 });
  sceneRef.load.spritesheet('resources', resourceGfx, { frameWidth: 32, frameHeight: 32 });
  
  sceneRef.load.spritesheet('blueGob', blueGobGfx, { frameWidth: 64, frameHeight: 64, endFrame: 38*8 });
  sceneRef.load.spritesheet('greenGob', greenGobGfx, { frameWidth: 64, frameHeight: 64, endFrame: 38*8 });
  sceneRef.load.spritesheet('redGob', redGobGfx, { frameWidth: 64, frameHeight: 64, endFrame: 38*8 });
  sceneRef.load.spritesheet('yellowGob', yellowGobGfx, { frameWidth: 64, frameHeight: 64, endFrame: 38*8 });

  sceneRef.load.audio('chop1', chop1Sfx);
  sceneRef.load.audio('chop2', chop2Sfx);
  sceneRef.load.audio('chop3', chop3Sfx);
  sceneRef.load.audio('skillup', skillupSfx);
  sceneRef.load.audio('tap', tapSfx);
  sceneRef.load.audio('buyskill', buyskillSfx);
}