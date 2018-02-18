import Phaser from 'phaser';
import {Socket} from 'phoenix';

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
let waitingForMoveResponse = false;

function create () {
  this.makeGobbo = makeGobbo.bind(this);
  const directions = ['up', 'upright', 'right', 'downright', 'down', 'downleft', 'left', 'upleft'];
  const animNames = ['idle', 'walk', 'carry', 'swing', 'pickup', 'block', 'die'];
  const animFrameCounts = [4, 8, 8, 6, 4, 2, 6];

  let frameCtr = 0; 
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

  this.makeGobbo(gobName);

  currentDir = 'down';
  imwalkinhere = false;
  this.input.on('pointerdown', function(pointer) {
    currentDir = determineDirection(gobs[gobName], pointer);
    gobs[gobName].anims.play(currentDir + '_walk');
    imwalkinhere = true;
    lastPointer = pointer;
  }, this);
  this.input.on('pointermove', function(pointer) {
    if (imwalkinhere) {
      let newDir = determineDirection(gobs[gobName], pointer);
      if (newDir != currentDir) {
        currentDir = newDir;
        gobs[gobName].anims.play(currentDir + '_walk');
      }
      lastPointer = pointer;
    }
  }, this)
  this.input.on('pointerup', function(pointer) {
    gobs[gobName].anims.play(currentDir + '_idle');
    imwalkinhere = false;
  }, this);

  for (let y = 0; y < game.renderer.height / 32 + 1; y++) {
    for (let x = 0; x < game.renderer.width / 32 + 1; x++) {
      let offset = y % 2 ? 16 : 0;
      let gfx = 'tree';
     // if (Math.random() > 0.75) { gfx = 'stump'; }
      let tree = this.add.sprite(x * 32 + offset, y * 32, gfx);
      tree.depth = tree.y;
    }
  }

  devSocket = new Socket("ws://localhost:4000/socket", {params: {username: gobName}});
  devSocket.connect();

  console.log("uhhh");
  let channel = devSocket.channel("object:stump", {});
  channel.on("create_stump_res", msg => console.log("Got message", msg));
  channel.join()
    .receive("ok", res => { console.log("Joined stump channel successfully", res); })
    .receive("error", res => { console.log("Unable to join stump channel", res); });

  channel.push("create_stump", { body: "what up stump brother" });

  channels.position = devSocket.channel("player:position", {});
  channels.position.on("new_position", msg => {
    let moveThisGob = gobs[msg.username];
    if (!moveThisGob) {
      // Must create the new gob
      moveThisGob = this.makeGobbo(msg.username);
    }

    if (msg.username == gobName) {
      waitingForMoveResponse = false;
    }
    moveThisGob.x = msg.x;
    moveThisGob.y = msg.y;
    moveThisGob.depth = moveThisGob.y;
  });
  channels.position.join()
    .receive("ok", res => { console.log("Joined pos channel successfully", res); })
    .receive("error", res => { console.log("Unable to join pos channel", res); });

  channels.position.push("wake_up", {});
}

function makeGobbo(name) {
  let gob = this.add.sprite(Number.MAX_VALUE, Number.MAX_VALUE, 'gobbo');
  gob.name = name;
  gob.anims.play('down_idle');
  gob.depth = gob.y;
  gobs[gob.name] = gob;

  return gob;
}

function update() {
  if (imwalkinhere && !waitingForMoveResponse) {
    waitingForMoveResponse = true;
    let gob = gobs[gobName];
    channels.position.push("req_position", { current: {x: gob.x, y: gob.y}, desired: {x: lastPointer.x, y: lastPointer.y} });
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

// Animations for other players
// Request positions from existing players on wake up as well as sending own
// Remove gobbo on disconnect
// Low priority: Wake up anim
// Low priority: Reverse wake up anim

// Track trees
// Replace tree with stump

// Show chopping anim
// Slow down while chopping (or pause for one iteration of chop menu)
// 'Scroll' camera


// Skill tree is actual tree
// Skills allow player to cut faster, build faster, build with less materials, buildings live longer after log off
// Player's accomplishments in a given session affect how much xp gained per hour while logged off (or how many hours xp is gained for)