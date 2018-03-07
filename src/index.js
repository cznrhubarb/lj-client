import Phaser from 'phaser';
import {Socket} from 'phoenix';
import World from './world';
import Lumberjack from './lumberjack';
import Tabby from './tabby';
import {LoadGraphics} from './gfxLoader';

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
  LoadGraphics(this);
}

let channels = {};

function create () {
  const colors = ['blue', 'green', 'red', 'yellow'];

  colors.forEach((color) => {
    loadAnims.call(this, color);
  });

  // HACK
  let clientName = "red";
  let connectedJacks = {};
  
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

  // this.input.on('pointerdown', function(pointer) {
  //   this.lastPointer = {
  //     x: pointer.x - this.cameras.main.width/2,
  //     y: pointer.y - this.cameras.main.height/2
  //   };
  // }, this);
  // this.input.on('pointermove', function(pointer) {
  //   if (this.lastPointer) {
  //     this.lastPointer.x = pointer.x - this.cameras.main.width/2;
  //     this.lastPointer.y = pointer.y - this.cameras.main.height/2;
  //   }
  // }, this);
  // this.input.on('pointerup', function(pointer) {
  //   this.lastPointer = null;
  // }, this);

  let devSocket = new Socket("ws://lj-sawver.herokuapp.com/socket", {params: {username: clientName}});
  devSocket.connect();

  let world = new World(devSocket, this, connectedJacks);
  this.world = world;
  this.world.setInputFuncs(onDown.bind(this), onMove.bind(this), onUp.bind(this));
  this.buildCallback = buildCallback.bind(this);

  channels.position = devSocket.channel("player:position", {});
  channels.position.on("presence_diff", diff => {
    Object.keys(diff.leaves).forEach(function(dcName) {
      // TODO: Play the dead animation, with a callback on complete to remove this lumberjack.
      //  Unfortunately callbacks are linked to animations, not instances of animations...
      connectedJacks[dcName].sprite.destroy();
      connectedJacks[dcName] = null;
    });
  });
  channels.position.on("new_position", msg => {
    let lumberingjack = connectedJacks[msg.username];
    if (!lumberingjack) {
      // Must create the new lumberjack
      // Color shouldn't be randomly decided. Needs to be sent over with initial position maybe?
      //  Maybe put into state?
      lumberingjack = new Lumberjack(msg.username, msg.color, this);
      if (msg.username == clientName) {
        lumberingjack.isClient = true;
        this.localjack = lumberingjack;
        this.cameras.main.startFollow(lumberingjack.sprite);
      }
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
  // I feel like I should make other channels or something, but I don't know what I'm doing and I can't slow down to find out at this point...
  channels.position.on("inventory_update", msg => {
    let holdingjack = connectedJacks[msg.username];
    if (holdingjack) {
      Object.assign(holdingjack.inventory, msg.inventory);
      for (var type in msg.inventory) {
        if (msg.inventory.hasOwnProperty(type)) {
          this.tabby.setInventoryCount(type, msg.inventory[type]);
        }
      }
    }
  });
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