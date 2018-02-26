export default class World {
  constructor(devSocket, scene, lumberjackList) {
    this.sceneRef = scene;
    this.lumberjacksRef = lumberjackList;
    this.tiles = {};
    this.recycleBin = {};
    this.renderedObjects = [];
    this.grasses = [];
    this.resources = [];

    this.lastCamCenter = null;

    this.objectChannel = devSocket.channel("object:all", {});
    this.objectChannel.on("get_obj_response", msg => {
      msg.objects.forEach((obj) => {
        this.fillTileAtCoords(obj.x, obj.y, obj.object);
      });
    });
    this.objectChannel.on("spawn_resource", msg => {
      this.spawnResources(msg);
    });
    this.objectChannel.join()
      .receive("ok", res => { console.log("Joined object channel successfully", res); })
      .receive("error", res => { console.log("Unable to join object channel", res); });

    this.createGrass();
  }

  createGrass() {
    this.fillWidth = Math.floor(this.sceneRef.cameras.main.width/64);
    this.fillWidth += this.fillWidth%2 ? 5 : 4;
    this.fillWidth *= 64;

    this.fillHeight = Math.floor(this.sceneRef.cameras.main.height/16);
    this.fillHeight += this.fillHeight%2 ? 5 : 4;
    this.fillHeight *= 16;

    for (let y = 0; y < this.fillHeight; y += 16) {
      let xOffset = 2 * (y%32);
      for (let x = 0; x < this.fillWidth; x += 64) {
        let grass = this.sceneRef.add.image(x + xOffset - 16, y - 16, 'grass', Math.floor(Math.random() * 4));
        grass.setOrigin(0, 0);
        this.grasses.push(grass);
      }
    }
  }

  spawnResources(msg) {
    const resourceFrames = ["wood", "stone", "steel", "rope", "cloth", "water", "paper", "gems", "gold", "magic"];

    let lumberjack = this.lumberjacksRef[msg.user_to_pickup];
    let position = msg.spawn_pos;
    msg.resources.forEach(resPair => {
      let type = resPair.type;
      let count = resPair.count;
      // Actual inventory is saved server side, but this should match up provided people aren't cheating. We double
      //  check by pulling from the server on login or when building anyway.
      lumberjack.inventory[type] += count;

      for (let i = 0; i < count; i++) {
        let worldPos = this.getWorldPosForTileCoords(position.x, position.y);
        let resource = this.sceneRef.add.image(worldPos.x, worldPos.y, 'resources', resourceFrames.indexOf(type));
        resource.setScale(0.5);
        resource.depth = resource.y + 1000;
        this.resources.push(resource);

        let xOff = Math.random() * 64 - 32;
        let yOff = Math.random() * 64 - 32;
        let tween = this.sceneRef.tweens.add({
          targets: resource,
          x: worldPos.x + xOff,
          y: worldPos.y + yOff,
          ease: 'Quart.easeOut',
          duration: 750,
          onComplete: () => {
            resource.tween = null;
          }
        });
        resource.tween = tween;
        resource.lumberjack = lumberjack;
      }
    });

    console.table(lumberjack.inventory);
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

    if (tile.contents) {
      this.recycle(tile.contents);
    }

    if (type != 'dirt') {
      let obj;
      if (this.recycleBin[type] && this.recycleBin[type].length > 0) {
        obj = this.recycleBin[type].pop();
        obj.renderFlags = 15;
        obj.active = true;
        obj.x = worldPos.x;
        obj.y = worldPos.y;
        obj.depth = obj.y;
      } else {
        obj = this.sceneRef.add.sprite(worldPos.x, worldPos.y, type);
        obj.depth = obj.y;
        obj.type = type;
      }

      tile.contents = obj;
      obj.tile = tile;

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

        if (!this.tiles[x][y].contents) {
          coordList.push({x: x, y: y});
        }
      }
    }
    
    if (coordList.length > 0) {
      this.objectChannel.push("get_obj_at", { coords: coordList });
    }
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

      // Update culling since we just teleported.
      this.cull();

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
      this.cull();
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
    // let culled = this.sceneRef.cameras.main.cull(this.renderedObjects);
    // this.renderedObjects.forEach((renderObject) => {
    //   this.recycleBin[renderObject.type] = renderObject;
    //   renderObject.renderFlags = 0;
    //   renderObject.active = false;
    // });

    // this.renderedObjects = this.renderedObjects.filter(ro => culled.indexOf(ro) == -1);

    let cam = this.sceneRef.cameras.main;

    // Manually cull, because the camera hasn't updated yet at this point and the cull function doesn't seem to work
    this.renderedObjects = this.renderedObjects.filter(ro => {
      let tl = ro.getTopLeft();
      let br = ro.getBottomRight();
      if (tl.x > this.lastCamCenter.x + cam.width ||
          tl.y > this.lastCamCenter.y + cam.height ||
          br.x < this.lastCamCenter.x - cam.width ||
          br.y < this.lastCamCenter.y - cam.height) {
        this.recycle(ro);
        return false;
      }
      return true;
    });

    // Let's roll some grass
    this.grasses.forEach(grass => {
      while (grass.x + grass.width > this.lastCamCenter.x + cam.width/2 + 64) {
        grass.x -= this.fillWidth;
      }
      while (grass.y + grass.height > this.lastCamCenter.y + cam.height/2 + 64) {
        grass.y -= this.fillHeight;
      }

      while (grass.x < this.lastCamCenter.x - cam.width/2 - 64) {
        grass.x += this.fillWidth;
      }
      while (grass.y < this.lastCamCenter.y - cam.height/2 - 64) {
        grass.y += this.fillHeight;
      }

      grass.depth = grass.y - 1000;
    });
  }

  recycle(renderObject) {
    // This check shouldn't be necessary if everything was working properly, but it's not.
    //  Maybe a single RO is getting placed into the list more than once?
    //  Or there are overlapping calls being made to cull?
    //  TODO: Investigate and fix.
    if (renderObject.tile) {
      // TODO: Don't know what the correct way to 'turn off' sprites is, so we can't recycle them yet.
      //renderObject.renderFlags = 0;
      //renderObject.active = false;

      // if (this.recycleBin[renderObject.type]) {
      //   this.recycleBin[renderObject.type].push(renderObject);
      // } else {
      //   this.recycleBin[renderObject.type] = [ renderObject ];
      // }
      
      renderObject.tile.contents = null;
      renderObject.tile = null;
      // Fuck it, we'll do it live.
      // Recycling is for nerds anyway.
      renderObject.destroy();
    }

    
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
      // The timeout below is synced to the player chop animation
      // TODO: Chopping needs to happen server side to prevent cheating
      window.setTimeout(() => {
        //this.objectChannel.push("set_obj_at", { objects: [{x: coords.x, y: coords.y, object: 'stump'}] });
        this.objectChannel.push("chop", { x: coords.x, y: coords.y });
      }, 300);
      return true;
    }

    return false;
  }

  updateResources() {
    this.resources = this.resources.filter(res => {
      if (!res.tween) {
        let follow = res.lumberjack.sprite;
        let delta = {x: follow.x - res.x, y: follow.y - res.y};
        let deltaLen = Math.sqrt(delta.x * delta.x + delta.y * delta.y);
        res.x += delta.x / deltaLen * 5;
        res.y += delta.y / deltaLen * 5;

        if (deltaLen <= 5) {
          res.destroy();
          return false;
        }
      }

      return true;
    });
  }
}