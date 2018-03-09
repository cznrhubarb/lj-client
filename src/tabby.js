import Phaser from 'phaser';

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

    this.tooltip = this.sceneRef.add.sprite(2000, 2000, 'tooltip');
    this.tooltip.setOrigin(0.5,1.0);
    this.tooltip.setScrollFactor(0);
    this.tooltip.depth = Number.MAX_VALUE;
    this.tooltipText = this.sceneRef.add.text(2000, 2000, '', { fontFamily: 'Lumberjack', fontSize: 16, color: '#242424', align: 'center' });
    this.tooltipText.setScrollFactor(0);
    this.tooltipText.depth = Number.MAX_VALUE;

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
    let self = this;
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

    let dragging = false;
    let lastPointer = {};
    let updateRow = function (row, delta) { row.forEach(icon => { icon.x += delta; }) };
    skillPanel.on('pointerdown', function(p) {
      dragging = true;
      lastPointer.x = p.x; lastPointer.y = p.y;
    });
    skillPanel.on('pointermove', function(p) {
      if (dragging) {
        let deltaX = p.x - lastPointer.x;
        lastPointer.x = p.x; lastPointer.y = p.y;
        if (lastPointer.y > 50 && lastPointer.y < 200) {
          updateRow(self.buildSkillIcons, deltaX);
        } else if (lastPointer.y > 225 && lastPointer.y < 375) {
          updateRow(self.gatherSkillIcons, deltaX);
        } else if (lastPointer.y > 400 && lastPointer.y < 550) {
          updateRow(self.leadSkillIcons, deltaX);
        }
      }
    });
    skillPanel.on('pointerout', function() {
      dragging = false;
    });
    skillPanel.on('pointerup', function() {
      dragging = false;
    });

    const buildSkills = ["skill_buildFire", "skill_buildWell", "skill_buildTent", "skill_buildPapermill", "skill_buildStoneMine", "skill_buildOven", "skill_buildBeacon", "skill_buildGoldMine"];
    this.buildSkillIcons = [];
    const gatherSkills = ["skill_gatherCloth", "skill_chopFast1", "skill_gatherRope", "skill_chopFast2", "skill_gatherMagic", "skill_chopFast3", "skill_gaterGem", "skill_chopDash1", "skill_chopDash2"];
    this.gatherSkillIcons = [];
    const leadSkills = ["skill_emote", "skill_trackBuilding", "skill_trackPlayer", "skill_buffWalk", "skill_buffChop", "skill_buffBuild"];
    this.leadSkillIcons = [];
    buildSkills.forEach((skill, idx) => {
      let xOff = idx * 110;
      let skillIcon = this.sceneRef.add.image(890 + xOff, 125, skill);
      skillIcon.setInteractive();
      skillIcon.setScrollFactor(0);
      skillIcon.depth = Number.MAX_VALUE;
      skillIcon.mask = new Phaser.Display.Masks.BitmapMask(this.sceneRef, skillPanel);
      this.contents[TabbyState.SkillOpen].push(skillIcon);
      this.buildSkillIcons.push(skillIcon);

      this.makeToolTip(skillIcon, skill, () => {});
    });
    gatherSkills.forEach((skill, idx) => {
      let xOff = idx * 110;
      let skillIcon = this.sceneRef.add.image(890 + xOff, 300, skill);
      skillIcon.setInteractive();
      skillIcon.setScrollFactor(0);
      skillIcon.depth = Number.MAX_VALUE;
      skillIcon.mask = new Phaser.Display.Masks.BitmapMask(this.sceneRef, skillPanel);
      this.contents[TabbyState.SkillOpen].push(skillIcon);
      this.gatherSkillIcons.push(skillIcon);

      this.makeToolTip(skillIcon, skill, () => {});
    });
    leadSkills.forEach((skill, idx) => {
      let xOff = idx * 110;
      let skillIcon = this.sceneRef.add.image(890 + xOff, 475, skill);
      skillIcon.setInteractive();
      skillIcon.setScrollFactor(0);
      skillIcon.depth = Number.MAX_VALUE;
      skillIcon.mask = new Phaser.Display.Masks.BitmapMask(this.sceneRef, skillPanel);
      this.contents[TabbyState.SkillOpen].push(skillIcon);
      this.leadSkillIcons.push(skillIcon);

      this.makeToolTip(skillIcon, skill, () => {});
    });
    /*
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
    */

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
    const tips = ["Tent\nWell rested lumberjacks walk faster when nearby.\n50 cloth / 25 rope",
                  "Camp Fire\nExtra light helps lumberjacks find better materials.\n50 wood",
                  "Well\nProduces water once in a while.\n50 wood",
                  "Stone Mine\nProduces stone once in a while.\n50 wood / 50 water",
                  "Gold Mine\nProduces gold once in a while.\n50 wood / 50 stone / 20 gems / 50 water",
                  "Paper Mill\nProduces paper once in a while.\n50 wood / 50 water",
                  "Oven\nWell fed lumberjacks chop wood faster.\n50 wood / 25 paper",
                  "Beacon\nThis will help other lumberjacks find you.\n50 wood / 50 magic / 50 gold"];
    buildings.forEach((type, idx) => {
      let xOff = (idx % 3) * 110;
      let yOff = Math.floor(idx / 3) * 120;
      let building = this.sceneRef.add.image(890 + xOff, 80 + yOff, type);
      building.setInteractive();
      this.shrinkToFit(building, 80, 80);
      building.setScrollFactor(0);
      building.depth = Number.MAX_VALUE;
      if (type != "campfire" && type != "well") {
        building.setTint(0x303030);
      }
      this.contents[TabbyState.BuildingOpen].push(building);
      
      let buildFunc = function (pointer) {
        self.sceneRef.buildCallback(type);
        self.clickTab(TabbyState.BuildingOpen);
      };
      this.makeToolTip(building, tips[idx], buildFunc);
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
    let self = this;
    item.setInteractive();
    let tout;
    let wasDown = false;
    item.on('pointerdown', function(pointer) {
      wasDown = true;
      if (!item.tipOpen) {
        clearTimeout(tout);
        tout = setTimeout(function() { 
          // SHOW THE TOOLTIP
          self.tooltipText.setText(tip);
          self.updateToolTip(pointer);
          item.tipOpen = true; 
        }, 500);
      }
    });
    let cancel = function() { 
      wasDown = false;
      if (item.tipOpen) {
        item.tipOpen = false;
        // HIDE THE TOOLTIP
        self.updateToolTip({x: 2000, y: 2000});
      } else {
        clearTimeout(tout);
      }
    };
    item.on('pointerout', cancel);
    item.on('pointerup', function() {
      if (!item.tipOpen && wasDown) { onTap(); }
      cancel();
    });
    item.on('pointermove', function(pointer) {
      if (item.tipOpen) { self.updateToolTip(pointer); }
    });
  }

  updateToolTip(pointer) {
    this.tooltip.x = pointer.x;
    this.tooltip.y = pointer.y;

    if (this.tooltip.y < this.tooltip.height) {
      this.tooltip.y += this.tooltip.height;
      // Update pointer y, only so the text also lines up
      pointer.y += this.tooltip.height + 40;
      if (!this.tooltip.flipY) {
        this.tooltip.toggleFlipY();
      }
    } else if (this.tooltip.y >= this.tooltip.height && this.tooltip.flipY) {
      this.tooltip.toggleFlipY();
    }
    
    this.tooltipText.x = pointer.x - this.tooltipText.width/2;
    this.tooltipText.y = pointer.y - this.tooltip.height + this.tooltipText.height * 0.25;
  }
}