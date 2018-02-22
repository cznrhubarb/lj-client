export default class World {
  constructor(devSocket, scene) {
    this.sceneRef = scene;
    this.tiles = {};
    this.recycleBin = {};
    this.renderedObjects = [];

    this.lastCamCenter = null;

    this.objectChannel = devSocket.channel("object:all", {});
    this.objectChannel.on("get_obj_response", msg => {
      msg.objects.forEach((obj) => {
        this.fillTileAtCoords(obj.x, obj.y, obj.object);
      });
    });
    this.objectChannel.join()
      .receive("ok", res => { console.log("Joined object channel successfully", res); })
      .receive("error", res => { console.log("Unable to join object channel", res); });

     this.createGrass();
  }

  createGrass() {
    for (let y = 0; y < 3000; y += 16) {
      let xOffset = 2 * (y%32);
      for (let x = 0; x < 3000; x += 64) {
        this.sceneRef.add.image(x + xOffset, y, 'grass', Math.floor(Math.random() * 4));
      }
    }
  }

  createTileAtCoords(xCoord, yCoord, requestImmediate) {
    let newTile = {};

    if (!this.tiles[xCoord]) {
      this.tiles[xCoord] = {};
    }
    this.tiles[xCoord][yCoord] = newTile;

    if (requestImmediate) {
      this.objectChannel.push("get_obj_at", { coords: [{x: xCoord, y: yCoord}] });
    }
  }

  fillTileAtCoords(xCoord, yCoord, type) {
    let tile = this.getTileForCoords(xCoord, yCoord);
    let worldPos = this.getWorldPosForTileCoords(xCoord, yCoord);

    // TODO: Don't think this is the correct way to 'turn off' sprites
    if (tile.contents) {
      //tile.contents.setTexture(type);
      //return;

      //tile.contents.destroy();
      //tile.contents = null;

      this.recycleBin[tile.contents.type] = tile.contents;
      tile.contents.renderFlags = 0;
      tile.contents.active = false;
      tile.contents = null;
    }

    if (type != 'dirt') {
      let obj;
      if (this.recycleBin[type] && this.recycleBin.length > 0) {
        obj = this.recycleBin.pop();
        obj.renderFlags = 15;
        obj.active = true;
      } else {
        obj = this.sceneRef.add.sprite(worldPos.x, worldPos.y, type);
        obj.depth = obj.y;
        obj.type = type;
      }

      tile.contents = obj;

      this.renderedObjects.push(obj);
    }
  }

  getWorldPosForTileCoords(xCoord, yCoord) {
    return {
      x: xCoord * 32 + (yCoord % 2 ? 16 : 0),
      y: yCoord * 32
    };
  }

  getTileForWorldPos(pos) {
    let coords = this.getTileCoordsForWorldPos(pos);
    return this.getTileForCoords(coords.x, coords.y);
  }

  getTileForCoords(xCoord, yCoord) {
    if (this.tiles[xCoord] && this.tiles[xCoord][yCoord]) {
      return this.tiles[xCoord][yCoord];
    } else {
      return this.createTileAtCoords(xCoord, yCoord);
    }
  }

  getTileCoordsForWorldPos(pos) {
    return {
      x: this.getTileXCoordForWorldPos(pos),
      y: this.getTileYCoordForWorldPos(pos)
    };
  }

  getTileXCoordForWorldPos(pos) {
    if (this.isStaggeredRow(pos)) {
      return Math.floor(pos.x / 32);
    } else {
      return Math.floor((pos.x - 16) / 32);
    }
  }

  getTileYCoordForWorldPos(pos) {
    return Math.floor((pos.y - 16) / 32);
  }

  requestTilesInCoordRange(tlCoords, brCoords) {
    let coordList = [];
    for (let x = tlCoords.x; x <= brCoords.x; x++) {
      for (let y = tlCoords.y; y <= brCoords.y; y++) {
        if (!this.tiles[x] || !this.tiles[x][y]) {
          this.createTileAtCoords(x, y);
        }

        coordList.push({x: x, y: y});
      }
    }
    
    this.objectChannel.push("get_obj_at", { coords: coordList });
  }

  isStaggeredRow(pos) {
    return this.getTileYCoordForWorldPos(pos) % 2 == 0;
  }

  updateCameraView(newCenterWorldPos) {
    let halfWidth = this.sceneRef.cameras.main.width/2 + 32;
    let halfHeight = this.sceneRef.cameras.main.height/2 + 64;

    if (!this.lastCamCenter) {
      // A bunch of special logic for when we first appear.
      // Wipe out the stuff where we're standing:
      //world.clearForestAround(moveThisGob, 1);

      // Show everything on screen:
      let topLeft = {x: newCenterWorldPos.x - halfWidth, y: newCenterWorldPos.y - halfHeight};
      let bottomRight = {x: newCenterWorldPos.x + halfWidth, y: newCenterWorldPos.y + halfHeight};
      this.forceWorldUpdateInCameraRect(topLeft, bottomRight);

      this.lastCamCenter = {x: newCenterWorldPos.x, y: newCenterWorldPos.y};
      return false;
    }
    
    // TODO: Don't love this. Chop should happen when the jack changes tiles,
    //  which should be checked on any movement, but not idle
    let shouldChop = false;
    if (newCenterWorldPos.x > this.lastCamCenter.x + 16) {
      let topLeft = {x: this.lastCamCenter.x + halfWidth, y: newCenterWorldPos.y - halfHeight};
      let bottomRight = {x: newCenterWorldPos.x + halfWidth, y: newCenterWorldPos.y + halfHeight};
      this.forceWorldUpdateInCameraRect(topLeft, bottomRight);

      this.lastCamCenter.x = newCenterWorldPos.x;
      shouldChop = true;
    } else if (newCenterWorldPos.x < this.lastCamCenter.x - 16) {
      let topLeft = {x: newCenterWorldPos.x - halfWidth, y: newCenterWorldPos.y - halfHeight};
      let bottomRight = {x: this.lastCamCenter.x - halfWidth, y: newCenterWorldPos.y + halfHeight};
      this.forceWorldUpdateInCameraRect(topLeft, bottomRight);

      this.lastCamCenter.x = newCenterWorldPos.x;
      shouldChop = true;
    }

    if (newCenterWorldPos.y > this.lastCamCenter.y + 32) {
      let topLeft = {x: newCenterWorldPos.x - halfWidth, y: this.lastCamCenter.y + halfHeight};
      let bottomRight = {x: newCenterWorldPos.x + halfWidth, y: newCenterWorldPos.y + halfHeight};
      this.forceWorldUpdateInCameraRect(topLeft, bottomRight);

      this.lastCamCenter.y = newCenterWorldPos.y;
      shouldChop = true;
    } else if (newCenterWorldPos.y < this.lastCamCenter.y - 32) {
      let topLeft = {x: newCenterWorldPos.x - halfWidth, y: newCenterWorldPos.y - halfHeight};
      let bottomRight = {x: newCenterWorldPos.x + halfWidth, y: newCenterWorldPos.y - halfHeight};
      this.forceWorldUpdateInCameraRect(topLeft, bottomRight);

      this.lastCamCenter.y = newCenterWorldPos.y;
      shouldChop = true;
    }

    // If we're gonna chop, let's just cull as well.
    if (shouldChop) {
      //this.cull();
    }

    return shouldChop;
  }

  forceWorldUpdateInCameraRect(topLeft, bottomRight) {
    let tlCoords = this.getTileCoordsForWorldPos(topLeft);
    let brCoords = this.getTileCoordsForWorldPos(bottomRight);
    this.requestTilesInCoordRange(tlCoords, brCoords);
  }

  cull() {
    // TODO: This is doing the opposite of what it should be it looks like: It culls object in the camera and leaves the rest
    //  Could it be related to the camera jump at the start? I've tried setting a time out and waiting, but no dice...
    let culled = this.sceneRef.cameras.main.cull(this.renderedObjects);
    console.log(culled.length);
    culled.forEach((renderObject) => {
      this.recycleBin[renderObject.type] = renderObject;
      renderObject.renderFlags = 0;
      renderObject.active = false;
    });

    this.renderedObjects = this.renderedObjects.filter(ro => culled.indexOf(ro) == -1);
  }

  clearForestAround(worldPos, radius) {
    let centerCoords = this.getTileCoordsForWorldPos(worldPos);
    let dirts = [];

    for (let y = centerCoords.y - radius; y <= centerCoords.y + radius; y++) {
      for (let x = centerCoords.x - radius; x <= centerCoords.x + radius; x++) {
        dirts.push({x: x, y: y, object: 'dirt'});
      }
    }

    this.objectChannel.push("set_obj_at", { objects: dirts });
  }

  chop(worldPos) {
    let coords = this.getTileCoordsForWorldPos(worldPos);
    let tile = this.getTileForCoords(coords.x, coords.y);
    if (tile.contents && tile.contents.type == 'tree') {
      // Pre-set the type to stump so that we don't accidentally chop down the same tree twice.
      tile.contents.type = 'stump';
      window.setTimeout(() => {
        this.objectChannel.push("set_obj_at", { objects: [{x: coords.x, y: coords.y, object: 'stump'}] });
      }, 300);
      return true;
    }

    return false;
  }
}