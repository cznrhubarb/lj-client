import Phaser from 'phaser';
import {Socket} from 'phoenix';
import World from './world';

import gobbo from './img/goblin_lumberjack_red.png';
import tree from './img/tree.png';
import stump from './img/stump.png';

let game = new Phaser.Game({
  type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: {
        preload: preload,
        create: create,
        update: update
    }
});
global.game = game;

let world;

function preload() {
  this.load.image('tree', tree);
  this.load.image('stump', stump);
  this.load.spritesheet('gobbo', gobbo, { frameWidth: 64, frameHeight: 64, endFrame: 38*8 });
}

let gobName = "red" + Math.random();
let gobs = {};
let lastPointer, imwalkinhere, currentDir;
let channels = {};
let devSocket;
let waitingForMoveResponse = true;
let lastCamUpdate;

function create () {
  this.makeGobbo = makeGobbo.bind(this);
  const directions = ['up', 'upright', 'right', 'downright', 'down', 'downleft', 'left', 'upleft'];
  const animNames = ['idle', 'walk', 'carry', 'swing', 'pickup', 'block', 'die'];
  const animFrameCounts = [4, 8, 8, 6, 4, 2, 6];

  let frameCtr = 0; 
  let idCtr = 0;
  directions.forEach((dir) => {
    animNames.forEach((name, idx) => {
      this.anims.create({
        key: dir + "_" + name,
        frames: this.anims.generateFrameNumbers('gobbo', { start: frameCtr, end: frameCtr + animFrameCounts[idx] - 1, first: frameCtr }),
        frameRate: 15,
        repeat: idx < animNames.length/2 ? -1 : 0,
        yoyo: idx == 3 || idx == 0
      });
      frameCtr += animFrameCounts[idx];
    });
  });

  let ourGob = this.makeGobbo(gobName);
  this.cameras.main.setBackgroundColor('#190D07');
  this.cameras.main.startFollow(ourGob);

  currentDir = 'down';
  imwalkinhere = false;
  this.input.on('pointerdown', function(pointer) {
    imwalkinhere = true;
    lastPointer = {
      x: pointer.x + this.cameras.main.scrollX,
      y: pointer.y + this.cameras.main.scrollY,
    };
  }, this);
  this.input.on('pointermove', function(pointer) {
    if (imwalkinhere) {
      lastPointer = {
        x: pointer.x + this.cameras.main.scrollX,
        y: pointer.y + this.cameras.main.scrollY,
      };
    }
  }, this)
  this.input.on('pointerup', function(pointer) {
    imwalkinhere = false;
  }, this);

  devSocket = new Socket("ws://localhost:4000/socket", {params: {username: gobName}});
  devSocket.connect();

  world = new World(devSocket);

  channels.position = devSocket.channel("player:position", {});
  channels.position.on("presence_state", state => {
    console.log('state');
    console.log(state);
  });
  channels.position.on("presence_diff", diff => {
    Object.keys(diff.leaves).forEach(function(dcName) {
      // TODO: Play the dead animation, with a callback on compplete to remove this gobbo.
      //  Unfortunately callbacks are linked to animations, not instances of animations...
      gobs[dcName].destroy();
      gobs[dcName] = null;
    });
  });
  channels.position.on("new_position", msg => {
    let moveThisGob = gobs[msg.username];
    if (!moveThisGob) {
      // Must create the new gob
      moveThisGob = this.makeGobbo(msg.username);
    }

    updateGobbo(moveThisGob, msg);
    if (msg.username == gobName) {
      console.log("Updating our position");
      waitingForMoveResponse = false;
      let halfWidth = this.cameras.main.width/2 + 32;
      let halfHeight = this.cameras.main.height/2 + 64;

      if (!lastCamUpdate) {
        let topLeft = {x: moveThisGob.x - halfWidth, y: moveThisGob.y - halfHeight};
        let bottomRight = {x: moveThisGob.x + halfWidth, y: moveThisGob.y + halfHeight};
        forceWorldUpdateInCameraRect(topLeft, bottomRight);

        lastCamUpdate = {x: moveThisGob.x, y: moveThisGob.y};
        return;
      }
      
      if (moveThisGob.x > lastCamUpdate.x + 16) {
        let topLeft = {x: lastCamUpdate.x + halfWidth, y: moveThisGob.y - halfHeight};
        let bottomRight = {x: moveThisGob.x + halfWidth, y: moveThisGob.y + halfHeight};
        forceWorldUpdateInCameraRect(topLeft, bottomRight);

        lastCamUpdate.x = moveThisGob.x;
      } else if (moveThisGob.x < lastCamUpdate.x - 16) {
        let topLeft = {x: moveThisGob.x - halfWidth, y: moveThisGob.y - halfHeight};
        let bottomRight = {x: lastCamUpdate.x - halfWidth, y: moveThisGob.y + halfHeight};
        forceWorldUpdateInCameraRect(topLeft, bottomRight);

        lastCamUpdate.x = moveThisGob.x;
      }

      if (moveThisGob.y > lastCamUpdate.y + 32) {
        let topLeft = {x: moveThisGob.x - halfWidth, y: lastCamUpdate.y + halfHeight};
        let bottomRight = {x: moveThisGob.x + halfWidth, y: moveThisGob.y + halfHeight};
        forceWorldUpdateInCameraRect(topLeft, bottomRight);

        lastCamUpdate.y = moveThisGob.y;
      } else if (moveThisGob.y < lastCamUpdate.y - 32) {
        let topLeft = {x: moveThisGob.x - halfWidth, y: moveThisGob.y - halfHeight};
        let bottomRight = {x: moveThisGob.x + halfWidth, y: lastCamUpdate.y - halfHeight};
        forceWorldUpdateInCameraRect(topLeft, bottomRight);

        lastCamUpdate.y = moveThisGob.y;
      }
    }
  });
  channels.position.join()
    .receive("ok", res => { console.log("Joined pos channel successfully", res); })
    .receive("error", res => { console.log("Unable to join pos channel", res); });

  channels.position.push("wake_up", {});
}

function forceWorldUpdateInCameraRect(topLeft, bottomRight) {
  let tlCoords = world.getTileCoordsForWorldPos(topLeft);
  let brCoords = world.getTileCoordsForWorldPos(bottomRight);
  world.requestTilesInCoordRange(tlCoords, brCoords);
}

function makeGobbo(name) {
  let gob = this.add.sprite(Number.MAX_VALUE, Number.MAX_VALUE, 'gobbo');
  gob.name = name;
  gob.anims.play('down_idle');
  gob.depth = gob.y;
  gobs[gob.name] = gob;

  return gob;
}

function updateGobbo(gobbo, newPos) {
  if (gobbo.x == Number.MAX_VALUE) {
    // TODO: Play this animation in reverse. Not supported yet?
    gobbo.anims.play('down_die', 5);
    gobbo.anims.forward = false;
    gobbo.lastDirection = 'down';
  } else if (gobbo.x == newPos.x) {
    if (gobbo.anims.currentAnim.key != "down_die" || !gobbo.anims.isPlaying) {
      gobbo.anims.play(gobbo.lastDirection + '_idle', true);
    }
  } else {
    let dir = determineDirection(gobbo, newPos);
    gobbo.anims.play(dir + '_walk', true);
    gobbo.lastDirection = dir;
  }
  
  gobbo.x = newPos.x;
  gobbo.y = newPos.y;
  gobbo.depth = gobbo.y;
}

function update() {
  // TODO: This should be throttled. It is firing way too often
  if (!waitingForMoveResponse) {
    let gob = gobs[gobName];
    if (imwalkinhere) {
      waitingForMoveResponse = true;
      channels.position.push("req_position", { current: {x: gob.x, y: gob.y}, desired: {x: lastPointer.x, y: lastPointer.y} });
    } else {
      let payload = { current: {x: gob.x, y: gob.y} };
      channels.position.push("req_position", payload);
    }
  }
}

function determineDirection(origin, pointer) {
  const directions = ['up', 'upright', 'right', 'downright', 'down', 'downleft', 'left', 'upleft'];
  let deltaX = pointer.x - origin.x;
  let deltaY = pointer.y - origin.y;

  let mostlyHorz = Math.abs(deltaX) / 2 > Math.abs(deltaY);
  if (mostlyHorz) {
    return deltaX > 0 ? 'right' : 'left';
  }
  let mostlyVert = Math.abs(deltaY) / 2 > Math.abs(deltaX);
  if (mostlyVert) {
    return deltaY > 0 ? 'down' : 'up';
  }

  if (deltaY > 0) {
    return deltaX > 0 ? 'downright' : 'downleft';
  } else {
    return deltaX > 0 ? 'upright' : 'upleft';
  }
}

// Lowish priority: Bug - stop moving if you just hold the mouse down. Happens because pointer doesn't update with camera moving
// Low priority: Wake up anim
// Low priority: Reverse wake up anim
// Low priority: Other colors
// Lowish priority: Start splitting this file up into multiples

// Replace tree with stump

// Show chopping anim
// Slow down while chopping (or pause for one iteration of chop menu)

// Only send network traffic to nearby duders

// ======================================= DESIGN SHIT =========================================
// Skill tree is actual tree
// Skills allow player to cut faster, build faster, build with less materials, buildings live longer after log off
// Player's accomplishments in a given session affect how much xp gained per hour while logged off (or how many hours xp is gained for)