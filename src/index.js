import Phaser from 'phaser';
import {Socket} from 'phoenix';
import World from './world';
import Lumberjack from './lumberjack';

import blueGobGfx from './img/goblin_lumberjack_blue.png';
import greenGobGfx from './img/goblin_lumberjack_green.png';
import redGobGfx from './img/goblin_lumberjack_red.png';
import yellowGobGfx from './img/goblin_lumberjack_yellow.png';
import treeGfx from './img/tree.png';
import stumpGfx from './img/stump.png';
import grassGfx from './img/grasses.png';

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

function preload() {
  this.load.image('tree', treeGfx);
  this.load.image('stump', stumpGfx);
  this.load.spritesheet('grass', grassGfx, { frameWidth: 64, frameHeight: 64 });
  
  //const colors = ['blue', 'green', 'red', 'yellow'];
  this.load.spritesheet('blueGob', blueGobGfx, { frameWidth: 64, frameHeight: 64, endFrame: 38*8 });
  this.load.spritesheet('greenGob', greenGobGfx, { frameWidth: 64, frameHeight: 64, endFrame: 38*8 });
  this.load.spritesheet('redGob', redGobGfx, { frameWidth: 64, frameHeight: 64, endFrame: 38*8 });
  this.load.spritesheet('yellowGob', yellowGobGfx, { frameWidth: 64, frameHeight: 64, endFrame: 38*8 });
}

let channels = {};

function create () {
  
  const colors = ['blue', 'green', 'red', 'yellow'];

  colors.forEach((color) => {
    loadAnims.call(this, color);
  });

  // HACK
  let clientName = "red" + Math.random();
  let color = colors[Math.floor(Math.random()*colors.length)];
  let localjack = new Lumberjack(clientName, color, this, true);
  this.localjack = localjack;
  let connectedJacks = {};
  connectedJacks[clientName] = localjack;
  
  this.cameras.main.setBackgroundColor('#190D07');
  this.cameras.main.startFollow(localjack.sprite);

  this.input.on('pointerdown', function(pointer) {
    this.lastPointer = {
      x: pointer.x - this.cameras.main.width/2,
      y: pointer.y - this.cameras.main.height/2
    };
  }, this);
  this.input.on('pointermove', function(pointer) {
    if (this.lastPointer) {
      this.lastPointer.x = pointer.x - this.cameras.main.width/2;
      this.lastPointer.y = pointer.y - this.cameras.main.height/2;
    }
  }, this)
  this.input.on('pointerup', function(pointer) {
    this.lastPointer = null;
  }, this);

  let devSocket = new Socket("ws://localhost:4000/socket", {params: {username: clientName}});
  devSocket.connect();

  let world = new World(devSocket, this);

  channels.position = devSocket.channel("player:position", {});
  channels.position.on("presence_diff", diff => {
    Object.keys(diff.leaves).forEach(function(dcName) {
      // TODO: Play the dead animation, with a callback on complete to remove this lumberjack.
      //  Unfortunately callbacks are linked to animations, not instances of animations...
      connectedJacks[dcName].destroy();
      connectedJacks[dcName] = null;
    });
  });
  channels.position.on("new_position", msg => {
    let lumberingjack = connectedJacks[msg.username];
    if (!lumberingjack) {
      // Must create the new lumberjack
      // Color shouldn't be randomly decided. Needs to be sent over with initial position maybe?
      //  Maybe put into state?
      color = colors[Math.floor(Math.random()*colors.length)];
      lumberingjack = new Lumberjack(msg.username, color, this);
      connectedJacks[msg.username] = lumberingjack;
    }

    lumberingjack.updatePos(msg);
    if (lumberingjack.isClient) {
      lumberingjack.isWaitingForServer = false;
      let shouldChop = world.updateCameraView(lumberingjack.sprite);
      
      if (shouldChop) {
        // Attempt to chop down a tree
        //  Not sure why I had to make the offset wonky numbers, but it looks OK now.
        let chopped = world.chop({x: lumberingjack.sprite.x + lumberingjack.sprite.width/4, y: lumberingjack.sprite.y + lumberingjack.sprite.height/2});
        if (chopped) {
          lumberingjack.chop();
        }
      }
    }
  });
  channels.position.join()
    .receive("ok", res => { console.log("Joined pos channel successfully", res); })
    .receive("error", res => { console.log("Unable to join pos channel", res); });

  channels.position.push("wake_up", {});
}

function loadAnims(color) {
  const directions = ['up', 'upright', 'right', 'downright', 'down', 'downleft', 'left', 'upleft'];
  const animNames = ['idle', 'walk', 'carry', 'swing', 'pickup', 'block', 'die'];
  const animFrameCounts = [4, 8, 8, 6, 4, 2, 6];

  let frameCtr = 0; 
  let idCtr = 0;
  directions.forEach((dir) => {
    animNames.forEach((name, idx) => {
      this.anims.create({
        key: dir + "_" + name + "_" + color,
        frames: this.anims.generateFrameNumbers(color + 'Gob', { start: frameCtr, end: frameCtr + animFrameCounts[idx] - 1, first: frameCtr }),
        frameRate: 15,
        repeat: idx < 3 ? -1 : 0,
        yoyo: idx == 0 // && idx == 3   // Should the chop yoyo? Or is that too tedious?
      });
      frameCtr += animFrameCounts[idx];
    });
  });
}

function update() {
  // TODO: This may need to be throttled.
  let requestPayload = this.localjack.updateInput(this.lastPointer);
  if (requestPayload) {
    channels.position.push("req_position", requestPayload);
  }
}

// THE BIG LIST OF TODO:

// Grass
// Infinite running animation bug
// Cull things off screen and put them in the recycle bin

// Inventory
// Buildings
// Skill tree
// Non-permanence?
// Interesting sights to see
// Log on blurbs

// Automatic size to fit device
// Get this shit working on Heroku or lumoludo.com

// Algo to place players nearby but not too nearby
// Wake up anim
// Reverse wake up anim
// Propogate swing anim to other clients
// Progogate color to other clients
// Introduced a bug somewhere. Now world is missing a line of trees. Perhaps related to starting camera position?? Comes back after camera scrolling a bit though.
// Clear forest radius algo

// Real Low Priority:
// This could probably be in a 'main.js' instead of index.js, but who the fuck really cares
// Let people put their names in (and add jack to all of them)
// Let people choose their color
// Only send network traffic to nearby duders
// How to split load across multiple servers?
// Chop anim happens when gobbo is already inside tree most of the time. Need to forward detect against movement.

// ======================================= DESIGN SHIT =========================================
// Skill tree is actual tree
// Skills allow player to cut faster, build faster, build with less materials, buildings live longer after log off
// Player's accomplishments in a given session affect how much xp gained per hour while logged off (or how many hours xp is gained for)

// Alternative design: Trees do not grow back (but buildings still decay?)
//  Players always given a mysterious unexplained compass needle