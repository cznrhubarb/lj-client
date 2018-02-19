export default class World {
  constructor(devSocket) {
    this.tiles = {};
    this.recycleBin = {};
    this.openField = {};

    this.objectChannel = devSocket.channel("object:all", {});
    this.objectChannel.on("get_obj_response", msg => {
      msg.objects.forEach((obj) => {
        this.fillTileAtCoords(obj.x, obj.y, obj.object);
      });
    });
    this.objectChannel.join()
      .receive("ok", res => { console.log("Joined object channel successfully", res); })
      .receive("error", res => { console.log("Unable to join object channel", res); });
  }
  
  //TODO: Need to request more than one at a time
  //TODO: Need to recycle off screen trees

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
        obj = global.game.scene.scenes[0].add.sprite(worldPos.x, worldPos.y, type);
        obj.depth = obj.y;
        obj.type = type;
      }

      tile.contents = obj;

      if (!this.openField[type]) {
        this.openField[type] = [];
      }
      this.openField[type].push(obj);
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
    
    //console.log(coordList);
    this.objectChannel.push("get_obj_at", { coords: coordList });
  }

  isStaggeredRow(pos) {
    return this.getTileYCoordForWorldPos(pos) % 2 == 0;
  }
}