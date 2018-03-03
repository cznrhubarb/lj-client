export default class Lumberjack {
  constructor(name, color, scene, isClient) {
    this.sceneRef = scene;
    this.name = name;
    this.color = color;
    this.lastDirection = 'down';
    this.isClient = isClient || false;
    this.isWaitingForServer = true;
    this.inventory = {};
    this.sprite = this.sceneRef.add.sprite(Number.MAX_VALUE, Number.MAX_VALUE, color + 'Gob');

    this.sprite.anims.play('down_idle_' + color);
    this.sprite.depth = this.sprite.y;
  }

  updatePos(newPos) {
    let spr = this.sprite;
    if (spr.x == Number.MAX_VALUE) {
      // TODO: Play this animation in reverse. Not supported yet?
      spr.anims.play('down_die_' + this.color, 5);
      spr.anims.forward = false;
    } else if (spr.x == newPos.x) {
      if ((spr.anims.currentAnim.key != 'down_die_' + this.color || spr.anims.currentAnim.key.endsWith('swing_' + this.color))
            || !spr.anims.isPlaying) {
              spr.anims.play(this.lastDirection + '_idle_' + this.color, true);
      }
    } else {
      let dir = this.determineDirection(spr, newPos);
      spr.anims.play(dir + '_walk_' + this.color, true);
      this.lastDirection = dir;
    }
    
    spr.x = newPos.x;
    spr.y = newPos.y;
    spr.depth = spr.y;
  }

  updateInput(pointer) {
    if (!this.isWaitingForServer) {
      let spr = this.sprite;
      if (!spr.anims.currentAnim.key.endsWith('swing_' + this.color) || !spr.anims.isPlaying) {
        if (pointer) {
          this.isWaitingForServer = true;
          return { current: {x: spr.x, y: spr.y}, desired: pointer };
        } else {
          this.isWaitingForServer = true;
          return { current: {x: spr.x, y: spr.y} };
        }
      }
    }
  }

  chop() {
    this.sprite.anims.play(this.lastDirection + '_swing_' + this.color, true);
  }

  determineDirection(origin, pointer) {
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
}