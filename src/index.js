import Phaser from 'phaser';
import {Socket} from 'phoenix';
import World from './world';
import Lumberjack from './lumberjack';
import Tabby from './tabby';
import {LoadGraphics} from './gfxLoader';

let game = new Phaser.Game({
  type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    scene: {
        preload: preload,
        create: create,
        update: update
    }
});

function preload() {
  LoadGraphics(this);
}

let channels = {};

function create () {
  const colors = ['blue', 'green', 'red', 'yellow'];

  colors.forEach((color) => {
    loadAnims.call(this, color);
  });

  // HACK
  this.clientName = "red";
  this.connectedJacks = {};
  
  this.cameras.main.setBackgroundColor('#190D07');
  
  this.tabby = new Tabby(this);

  let onDown = function(pointer) {
    this.lastPointer = {
      x: pointer.x - this.cameras.main.width/2,
      y: pointer.y - this.cameras.main.height/2
    };
  };
  let onMove = function(pointer) {
    if (this.lastPointer) {
      this.lastPointer.x = pointer.x - this.cameras.main.width/2;
      this.lastPointer.y = pointer.y - this.cameras.main.height/2;
    }
  }
  let onUp = function(pointer) {
    this.lastPointer = null;
  };

  let serverLocation = "wss://lj-sawver.herokuapp.com/socket";
  if (window.location.href.indexOf("localhost") != -1) {
    serverLocation = "ws://localhost:4000/socket";
  }
  let devSocket = new Socket(serverLocation, {params: {username: this.clientName}});
  devSocket.connect();

  this.world = new World(devSocket, this, this.connectedJacks);
  this.world.setInputFuncs(onDown.bind(this), onMove.bind(this), onUp.bind(this));
  this.buildCallback = buildCallback.bind(this);

  // I feel like I should make other channels or something, but I don't know what I'm doing and I can't slow down to find out at this point...
  channels.position = devSocket.channel("player:position", {});

  channels.position.on("presence_diff", onPresenceDiff.bind(this));
  channels.position.on("new_position", onNewPosition.bind(this));
  channels.position.on("inventory_update", onInventoryUpdate.bind(this));
  channels.position.on("skill_update", onSkillUpdate.bind(this));
  channels.position.on("skill_info", onSkillInfo.bind(this));
  channels.position.on("building_info", onBuildingInfo.bind(this));

  channels.position.join()
    .receive("ok", res => { console.log("Joined pos channel successfully", res); })
    .receive("error", res => { console.log("Unable to join pos channel", res); });

  channels.position.push("wake_up", {});
}

// Gonna regret not just setting up an event system later probably...
function buildCallback(type) {
  this.world.build(type, {x: this.localjack.sprite.x + this.localjack.sprite.width/4, y: this.localjack.sprite.y + this.localjack.sprite.height/2});
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
  // TODO: This may need to be throttled. Should be able to use Phx.Presence instead of sending constant idle messages
  if (this.localjack) {
    let requestPayload = this.localjack.updateInput(this.lastPointer);
    if (requestPayload) {
      channels.position.push("req_position", requestPayload);
    }
  }

  this.world.updateResources();
}

function onPresenceDiff(diff) {
  Object.keys(diff.leaves).forEach(function(dcName) {
    // TODO: Play the dead animation, with a callback on complete to remove this lumberjack.
    //  Unfortunately callbacks are linked to animations, not instances of animations...
    this.connectedJacks[dcName].sprite.destroy();
    this.connectedJacks[dcName] = null;
  });
}

function onNewPosition(msg) {
  let lumberingjack = this.connectedJacks[msg.username];
  if (!lumberingjack) {
    // Must create the new lumberjack
    // Color shouldn't be randomly decided. Needs to be sent over with initial position maybe?
    //  Maybe put into state?
    lumberingjack = new Lumberjack(msg.username, msg.color, this);
    if (msg.username == this.clientName) {
      lumberingjack.isClient = true;
      this.localjack = lumberingjack;
      this.cameras.main.startFollow(lumberingjack.sprite);
    }
    this.connectedJacks[msg.username] = lumberingjack;
  }

  lumberingjack.updatePos(msg);
  if (lumberingjack.isClient) {
    lumberingjack.isWaitingForServer = false;
    let shouldChop = this.world.updateCameraView(lumberingjack.sprite);
    
    if (shouldChop) {
      // Attempt to chop down a tree
      let chopped = this.world.chop({x: lumberingjack.sprite.x + lumberingjack.sprite.width/4, y: lumberingjack.sprite.y + lumberingjack.sprite.height/2});
      if (chopped) {
        lumberingjack.chop();
      }
    }
  }
}

function onInventoryUpdate(msg) {
  let holdingjack = this.connectedJacks[msg.username];
  if (holdingjack) {
    Object.assign(holdingjack.inventory, msg.inventory);

    if (holdingjack.isClient) {
      for (var type in msg.inventory) {
        if (msg.inventory.hasOwnProperty(type)) {
          this.tabby.setInventoryCount(type, msg.inventory[type]);
        }
      }

      this.tabby.updateBuildingIcons();
    }
  }
}

function onSkillUpdate(msg) {
  this.tabby.earnedSkills = msg.skills;
  this.tabby.updateBuildingIcons();
  this.tabby.updateSkillIcons();
}

function onSkillInfo(msg) {
  this.tabby.createSkillTab(msg.skills);
}

function onBuildingInfo(msg) {
  this.tabby.createBuildingTab(msg.buildings);
}