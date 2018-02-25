import Phaser from 'phaser';
import {Socket} from 'phoenix';
import World from './world';
import Lumberjack from './lumberjack';
import {uuidv4} from './utils.js';

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

  let guid = localStorage.getItem('guid');
  if (!guid) {
    guid = uuidv4();
    localStorage.setItem('guid', guid);
  }
  
  const colors = ['blue', 'green', 'red', 'yellow'];

  colors.forEach((color) => {
    loadAnims.call(this, color);
  });

  // HACK
  let clientName = "red";
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

  let devSocket = new Socket("ws://localhost:4000/socket", {params: {username: clientName, guid: guid}});
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

// Remember log on per device - localStorage?
//  Store player info on server
//  Return that info to player on log in
// Clear forest radius algo
// Inventory
//  Brainstorm some other collectibles
//    Gems
//    Stone
//    Gold
//    Paper
//    Food
//    Bait/traps
//    Plants/seedlings/crops/flowers
//    Electricity
//    Fuel
//    Clock/hourglass/watch
//    Magic
//    Glue
//    Cloth
//    Tools
//    Steel
//    Water
//    Cardboard
//  Input method to show inventory
//  Find/create some assets     (Maybe use all emojis?)
//  Show inventory bag
//  Collect wood & show count in bag
//  Store inventory on server
// Buildings
//  Brainstorm some building effects
//    Generate non-wood resources
//    Trade wood for non-wood resources
//    Clear large swath of surrounding forest
//    Increase XP gain
//    Beacon
//    Flags/Direction markers
//    AoE effects (faster walk, chop, collection amount)
//    Skill tree equivalent (if skill trees are rare objects to find)
//    Fast travel between points
//    Anchor (adds permanence or semipermanence to other buildings)
//  Find/create some assets
//  Input method to create a building
//  Server -> Clear forest, place building -> All players
//  Propagate/manage effects (probably server side handling?)
// Skill tree
//  Brainstorm some skills
//   Possible skill archetypes? Builder, Gatherer, Teammate, Settler
//*** Builder */
//    The ability to build at all / More build options / better versions of buildings
//    Using one resource for another (at heavy cost)
//    Build faster
//    Build for cheaper
//*** Gatherer */
//    Teleport
//    Chop faster
//    Walk faster
//    Collect more mats from doing things
//    Collect alternative mats in addition to traditional
//*** Teammate */
//    Tracking (find players/buildings off screen)
//    Ability to emote (or other limited forms of communication)
//    Guiding light, other players will occasionally get a radar beep for your character
//    Other nearby players gain benefits (chop, buildspd, buildcost, etc)
//    Log in closer to other players
//*** Settler */
//    Buildings last longer
//    Chopped trees stay down longer
//    Body lasts longer (or shorter?) before fading after log off
//    Small chance to log in to the same spot you logged out at
//*** Graverobber? Necromancer? Dream Genie? */
//    Able to see other player's ghosts after their bodies have faded
//    Able to send a push notification to another nearby player immediately after the log off (so they could log back on and meet up)
//    |-> And able to pull player back to the place they logged out
//    Able to see a brief beacon when another player logs off within a certain distance
//  Design idea: Spreading into other archetypes trees costs MORE points, instead of all early branches being cheap.
//    More like D&D multiclassing than UO 30%-in-a-ton-of-skills style
//  Find/create some assets
//  Input method to open skill tree, choose new skills
//  Server -> Store skills -> Return to player on next log in
//  Grow the skill tree
// Introduced a bug somewhere. Now world is missing a line of trees. Seen when heading north, and repeats itself.
// Non-permanence?
// Interesting sights to see
// Log on blurbs

// Automatic size to fit device
// Get this shit working on Heroku or lumoludo.com

// Loading screen
// Wake up anim
// Reverse wake up anim
// Infinite running animation bug
// Propogate swing anim to other clients
// Progogate color to other clients

// Real Low Priority:
// Update origin points for trees and gobbos so that they match their 'feet'.
// Algo to place players nearby but not too nearby
// Let people put their names in (and add jack to all of them)
// Let people choose their color
// Only send network traffic to nearby duders
// How to split load across multiple servers?
// Chop anim happens when gobbo is already inside tree most of the time. Need to forward detect against movement. 
// User authentication
// This could probably be in a 'main.js' instead of index.js, but who the fuck really cares

// ======================================= DESIGN SHIT =========================================
// Skill tree is actual tree
// Skills allow player to cut faster, build faster, build with less materials, buildings live longer after log off
// Player's accomplishments in a given session affect how much xp gained per hour while logged off (or how many hours xp is gained for)
// Perhaps there are multiple skill trees found randomly, and you have to chop down a skill tree
//  to gain a new skill

// Alternative design: Trees do not grow back (but buildings still decay?)
//  Players always given a mysterious unexplained compass needle

// Bonuses for meeting/participating with other players?
// Perhaps some buildings require multiple players to work together to build
// Buildings don't show up in build list until available: Create some unknowns for players to discover

// Maybe player created buildings turn into ruins and become the interesting things other players find later