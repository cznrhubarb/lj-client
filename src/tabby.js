const TabbyState = { NoneOpen: 1, InventoryOpen: 2, SkillOpen: 3, BuildingOpen: 4, Transitioning: 5 }

// TODO: The individual tabs should be in their own file and this can just be the opening/closing. This file is getting too unwieldy.
//    Also, each tab should be a Phaser Scene for the most idiomatic approach to input, camera, etc.
export default class Tabby {
  constructor(sceneRef) {
    this.sceneRef = sceneRef;
    this.create();
  }

  create() {
    this.sceneRef = this.sceneRef || this;
    this.tabs = {};
    this.contents = { [TabbyState.InventoryOpen]: [], [TabbyState.SkillOpen]: [], [TabbyState.BuildingOpen]: [] };
    this.inventoryCounts = {};

    this.createInventoryTab(this.sceneRef);
    this.createSkillTab(this.sceneRef);
    this.createBuildingTab(this.sceneRef);

    this.state = TabbyState.NoneOpen;
  }

  createInventoryTab() {
    let inventoryTab = this.sceneRef.add.sprite(800-75, 15, 'inventoryTab');
    inventoryTab.setOrigin(0,0);
    inventoryTab.setScrollFactor(0);
    inventoryTab.depth = Number.MAX_VALUE;
    this.tabs[TabbyState.InventoryOpen] = inventoryTab;
    inventoryTab.setInteractive();
    inventoryTab.on('pointerdown', function(p) {});

    let inventoryPanel = this.sceneRef.add.sprite(800, 0, 'inventoryPanel');
    inventoryPanel.setOrigin(0,0);
    inventoryPanel.setScrollFactor(0);
    inventoryPanel.depth = Number.MAX_VALUE;
    this.contents[TabbyState.InventoryOpen].push(inventoryPanel);
    inventoryPanel.setInteractive();
    inventoryPanel.on('pointerdown', function(p) {});
    
    const resources = ["wood", "stone", "steel", "rope", "cloth", "water", "paper", "gems", "gold", "magic"];
    resources.forEach((type, idx) => {
      let xOff = (idx % 5) * 70;
      let yOff = Math.floor(idx / 5) * 100;
      let resource = this.sceneRef.add.image(860 + xOff, 60 + yOff, 'resources', resources.indexOf(type));
      resource.setScrollFactor(0);
      resource.depth = Number.MAX_VALUE;
      this.contents[TabbyState.InventoryOpen].push(resource);

      let count = this.sceneRef.add.text(860 + xOff, 80 + yOff, 'x 0', { fontFamily: 'Lumberjack', fontSize: 24, color: '#444444' });
      count.setScrollFactor(0);
      count.origX = count.x;
      count.x -= count.width/2;
      count.depth = Number.MAX_VALUE;
      this.contents[TabbyState.InventoryOpen].push(count);
      this.inventoryCounts[type] = count;
    });

    let self = this;
    inventoryTab.on('pointerup', function (pointer) {
      self.clickTab(TabbyState.InventoryOpen);
    });
  }

  setInventoryCount(type, count) {
    let label = this.inventoryCounts[type];
    let xOff = label.width/2;
    label.setText('x ' + count);
    label.x = label.x - label.width/2 + xOff;
  }

  createSkillTab() {
    let skillTab = this.sceneRef.add.sprite(800-75, 90, 'skillTab');
    skillTab.setOrigin(0,0);
    skillTab.setScrollFactor(0);
    skillTab.depth = Number.MAX_VALUE;
    this.tabs[TabbyState.SkillOpen] = skillTab;
    skillTab.setInteractive();
    skillTab.on('pointerdown', function(p) {});

    let skillPanel = this.sceneRef.add.sprite(800, 0, 'skillPanel');
    skillPanel.setOrigin(0,0);
    skillPanel.setScrollFactor(0);
    skillPanel.depth = Number.MAX_VALUE;
    this.contents[TabbyState.SkillOpen].push(skillPanel);
    skillPanel.setInteractive();
    skillPanel.on('pointerdown', function(p) {});

    let self = this;
    skillTab.on('pointerup', function (pointer) {
      self.clickTab(TabbyState.SkillOpen);
    });
  }

  createBuildingTab() {
    let buildingTab = this.sceneRef.add.sprite(800-75, 165, 'buildingTab');
    buildingTab.setOrigin(0,0);
    buildingTab.setScrollFactor(0);
    buildingTab.depth = Number.MAX_VALUE;
    this.tabs[TabbyState.BuildingOpen] = buildingTab;
    buildingTab.setInteractive();
    buildingTab.on('pointerdown', function(p) {});

    let buildingPanel = this.sceneRef.add.sprite(800, 0, 'buildingPanel');
    buildingPanel.setOrigin(0,0);
    buildingPanel.setScrollFactor(0);
    buildingPanel.depth = Number.MAX_VALUE;
    this.contents[TabbyState.BuildingOpen].push(buildingPanel);
    buildingPanel.setInteractive();
    buildingPanel.on('pointerdown', function(p) {});

    let self = this;
    const buildings = ["tent", "campfire", "well", "mine_stone", "mine_gold", "papermill", "oven", "beacon"];
    buildings.forEach((type, idx) => {
      let xOff = (idx % 3) * 110;
      let yOff = Math.floor(idx / 3) * 120;
      let building = this.sceneRef.add.image(890 + xOff, 80 + yOff, type);
      building.setInteractive();
      this.shrinkToFit(building, 80, 80);
      building.setScrollFactor(0);
      building.depth = Number.MAX_VALUE;
      if (type != "campfire") {
        building.setTint(0x303030);
      }
      this.contents[TabbyState.BuildingOpen].push(building);
      
      let buildFunc = function (pointer) {
        self.sceneRef.buildCallback(type);
        self.clickTab(TabbyState.BuildingOpen);
      };
      this.makeToolTip(building, type, buildFunc);
    });

    buildingTab.on('pointerup', function (pointer) {
      self.clickTab(TabbyState.BuildingOpen);
    });
  }

  clickTab(toState) {
    switch (this.state) {
      case TabbyState.Transitioning:
        return;
      case TabbyState.NoneOpen:
        this.openTab(toState);
        break;
      case toState:
        this.closeTab(toState);
        break;
      default:
        this.closeTab(this.state);
        this.openTab(toState);
        break;
    }

    this.state = TabbyState.Transitioning;
  }

  openTab(state) {
    let tab = this.tabs[state];
    let contents = this.contents[state];
    this.state = TabbyState.Transitioning;

    this.sceneRef.tweens.add({
      targets: tab,
      x: tab.x - 500,
      ease: 'Quart.easeOut',
      duration: 750,
      onComplete: () => {
        this.state = state;
      }
    });
    contents.forEach(item => {
      this.sceneRef.tweens.add({
        targets: item,
        x: item.x - 500,
        ease: 'Quart.easeOut',
        duration: 750
      });
    });
  }

  closeTab(state) {
    let tab = this.tabs[state];
    let contents = this.contents[state];
    this.state = TabbyState.Transitioning;

    this.sceneRef.tweens.add({
      targets: tab,
      x: tab.x + 500,
      ease: 'Quart.easeOut',
      duration: 750,
      onComplete: () => {
        this.state = TabbyState.NoneOpen;
      }
    });
    contents.forEach(item => {
      this.sceneRef.tweens.add({
        targets: item,
        x: item.x + 500,
        ease: 'Quart.easeOut',
        duration: 750
      });
    });
  }

  shrinkToFit(image, width, height) {
    if (image.width <= width && image.height <= height) {
      return;
    }

    let widthScale = image.width / width;
    let heightScale = image.height / height;
    if (widthScale > heightScale) {
      image.setScale(1/widthScale, 1/widthScale);
    } else {
      image.setScale(1/heightScale, 1/heightScale);
    }
  }

  makeToolTip(item, tip, onTap) {
    item.setInteractive();
    let tout;
    item.on('pointerdown', function() {
      if (!item.tipOpen) {
        clearTimeout(tout);
        tout = setTimeout(function() { 
          // SHOW THE TOOLTIP
          console.log(tip); 
          item.tipOpen = true; 
        }, 500);
      }
    });
    let cancel = function() { 
      if (item.tipOpen) {
        item.tipOpen = false;
        // HIDE THE TOOLTIP
        console.log("Tooltip closed"); 
      } else {
        clearTimeout(tout);
      }
    };
    item.on('pointerout', cancel);
    item.on('pointerup', function() {
      if (!item.tipOpen) { onTap(); }
      cancel();
    });
  }
}