import Phaser from 'phaser';

const TabbyState = { NoneOpen: 1, InventoryOpen: 2, SkillOpen: 3, BuildingOpen: 4, Transitioning: 5 }

// TODO: The individual tabs should be in their own file and this can just be the opening/closing. This file is getting too unwieldy.
//    Also, each tab should be a Phaser Scene for the most idiomatic approach to input, camera, etc.
export default class Tabby {
  constructor(sceneRef) {
    this.sceneRef = sceneRef;
    this.create();
    this.tapSfx = sceneRef.sound.add('tap');
    this.buyskillSfx = sceneRef.sound.add('buyskill');
  }

  create() {
    this.sceneRef = this.sceneRef || this;
    this.tabs = {};
    this.contents = { [TabbyState.InventoryOpen]: [], [TabbyState.SkillOpen]: [], [TabbyState.BuildingOpen]: [] };
    this.inventoryCounts = {};
    this.earnedSkills = [];

    this.createInventoryTab();
    // These get created when we first get the necessary information instead.
    //this.createSkillTab();
    //this.createBuildingTab();

    this.tooltip = this.sceneRef.add.image(2000, 2000, 'uiAtlas', 'tooltip.png');
    this.tooltip.setOrigin(0.5,1.0);
    this.tooltip.setScrollFactor(0);
    this.tooltip.depth = 20000;
    this.tooltipText = this.sceneRef.add.text(2000, 2000, '', { fontFamily: 'Lumberjack', fontSize: 16, color: '#242424', align: 'center', wordWrap: { width: this.tooltip.width - 20 } });
    this.tooltipText.setScrollFactor(0);
    this.tooltipText.setOrigin(0.5);
    this.tooltipText.depth = 20000;

    this.state = TabbyState.NoneOpen;
  }

  createInventoryTab() {
    let inventoryTab = this.sceneRef.add.image(this.sceneRef.cameras.main.width-75, 15, 'uiAtlas', 'inventory_tab.png');
    inventoryTab.setOrigin(0,0);
    inventoryTab.setScrollFactor(0);
    inventoryTab.depth = 20000 - 1000;
    this.tabs[TabbyState.InventoryOpen] = inventoryTab;
    inventoryTab.setInteractive();
    inventoryTab.on('pointerdown', function(p) {});

    let inventoryPanel = this.sceneRef.add.image(this.sceneRef.cameras.main.width, 0, 'uiAtlas', 'inventory_panel.png');
    inventoryPanel.setOrigin(0,0);
    inventoryPanel.setScrollFactor(0);
    inventoryPanel.depth = 20000 - 1000;
    this.contents[TabbyState.InventoryOpen].push(inventoryPanel);
    inventoryPanel.setInteractive();
    inventoryPanel.on('pointerdown', function(p) {});
    
    const resources = ["wood", "stone", "steel", "rope", "cloth", "water", "gold", "paper", "gems", "magic"];
    resources.forEach((type, idx) => {
      let xOff = (idx % 5) * 70 + 60;
      let yOff = Math.floor(idx / 5) * 100;
      let resource = this.sceneRef.add.image(this.sceneRef.cameras.main.width + xOff, 60 + yOff, 'resources', resources.indexOf(type));
      resource.setScrollFactor(0);
      resource.depth = 20000 - 1000;
      this.contents[TabbyState.InventoryOpen].push(resource);

      let count = this.sceneRef.add.text(this.sceneRef.cameras.main.width + xOff, 80 + yOff, 'x 0', { fontFamily: 'Lumberjack', fontSize: 24, color: '#444444' });
      count.setScrollFactor(0);
      count.x -= count.width/2;
      count.depth = 20000 - 1000;
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

  createSkillTab(skillList) {
    if (this.tabs[TabbyState.SkillOpen]) { return; }

    let self = this;
    let skillTab = this.sceneRef.add.image(this.sceneRef.cameras.main.width-75, 90, 'uiAtlas', 'skill_tab.png');
    skillTab.setOrigin(0,0);
    skillTab.setScrollFactor(0);
    skillTab.depth = 20000 - 900;
    this.tabs[TabbyState.SkillOpen] = skillTab;
    skillTab.setInteractive();
    skillTab.on('pointerdown', function(p) {});

    let skillPanel = this.sceneRef.add.image(this.sceneRef.cameras.main.width, 0, 'uiAtlas', 'skill_panel.png');
    skillPanel.setOrigin(0,0);
    skillPanel.setScrollFactor(0);
    skillPanel.depth = 20000 - 900;
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
          updateRow(self.skillIcons["builder"], deltaX);
        } else if (lastPointer.y > 225 && lastPointer.y < 375) {
          updateRow(self.skillIcons["gatherer"], deltaX);
        } else if (lastPointer.y > 400 && lastPointer.y < 550) {
          updateRow(self.skillIcons["leader"], deltaX);
        }
      }
    });
    skillPanel.on('pointerout', function() {
      dragging = false;
    });
    skillPanel.on('pointerup', function() {
      dragging = false;
    });

    this.skillIcons = { "builder": [], "gatherer": [], "leader": [] };
    this.skillList = skillList;
    skillList.forEach((skill, idx) => {
      let xOff = this.skillIcons[skill.tree].length * 110 + 90;
      let yPos = 125;
      if (skill.tree == "gatherer") { yPos = 300; }
      if (skill.tree == "leader") { yPos = 475; }
      let skillIcon = this.sceneRef.add.image(this.sceneRef.cameras.main.width + xOff, yPos, "skillsAtlas", skill.name + ".png");
      skillIcon.setInteractive();
      skillIcon.setScrollFactor(0);
      skillIcon.depth = 20000 - 900;
      skillIcon.mask = new Phaser.Display.Masks.BitmapMask(this.sceneRef, skillPanel);
      this.contents[TabbyState.SkillOpen].push(skillIcon);
      this.skillIcons[skill.tree].push(skillIcon);
      skill.icon = skillIcon;

      let tip = skill.display_name + "\n" + skill.description;
      if (skill.prereqs.length > 0) { tip += "\n" + this.buildPrereqString(skill); }
      this.makeToolTip(skillIcon, tip, () => {
        // Purchase skill
        if (!this.earnedSkills.includes(skill.name) && this.hasSkillPrereqs(skill)) {
          this.buyskillSfx.play();
          this.sceneRef.buySkillCallback(skill.name);
        }
      });
    });

    let classText = this.sceneRef.add.text(this.sceneRef.cameras.main.width + 50, 45, 'Builder', { fontFamily: 'Lumberjack', fontSize: 32, color: '#444444' });
    classText.setScrollFactor(0);
    classText.depth = 20000 - 890;
    this.contents[TabbyState.SkillOpen].push(classText);
    classText = this.sceneRef.add.text(this.sceneRef.cameras.main.width + 50, 220, 'Gatherer', { fontFamily: 'Lumberjack', fontSize: 32, color: '#444444' });
    classText.setScrollFactor(0);
    classText.depth = 20000 - 890;
    this.contents[TabbyState.SkillOpen].push(classText);
    classText = this.sceneRef.add.text(this.sceneRef.cameras.main.width + 50, 395, 'Leader', { fontFamily: 'Lumberjack', fontSize: 32, color: '#444444' });
    classText.setScrollFactor(0);
    classText.depth = 20000 - 890;
    this.contents[TabbyState.SkillOpen].push(classText);

    this.skillPointsLabel = this.sceneRef.add.text(this.sceneRef.cameras.main.width + skillPanel.width/2, 550, 'Available Skill Points: ', { fontFamily: 'Lumberjack', fontSize: 22, color: '#444444' });
    this.skillPointsLabel.setScrollFactor(0);
    this.skillPointsLabel.depth = 20000 - 890;
    this.skillPointsLabel.setOrigin(0.5);
    this.contents[TabbyState.SkillOpen].push(this.skillPointsLabel);

    skillTab.on('pointerup', function (pointer) {
      self.clickTab(TabbyState.SkillOpen);
    });
  }
  
  updateSkillIcons() {
    this.skillList.forEach((skill) => {
      if (this.earnedSkills.includes(skill.name)) {
        skill.icon.setTint(0xFFFFFF);
      } else if (this.hasSkillPrereqs(skill)) {
        skill.icon.setTint(0x505050);
      } else {
        skill.icon.setTint(0x000000);
      }
    });
  }
  
  updateSkillPoints(points) {
    this.skillPointsLabel.setText('Available Skill Points: ' + points);
  }

  buildPrereqString(skill) {
    let prereqString = "Requires: ";
    // Could be a reduce instead of a foreach if I wanted to be fancy.
    skill.prereqs.forEach((pre, idx) => {
      prereqString += this.skillList.find(s => s.name == pre).display_name;
      if (idx < skill.prereqs.length -1 ) {
        prereqString += " / ";
      }
    });
    return prereqString;
  }

  hasSkillPrereqs(skill) {
    return skill.prereqs.every(pre => this.earnedSkills.includes(pre));
  }

  createBuildingTab(buildingList) {
    if (this.tabs[TabbyState.BuildingOpen]) { return; }

    let buildingTab = this.sceneRef.add.image(this.sceneRef.cameras.main.width-75, 165, 'uiAtlas', 'building_tab.png');
    buildingTab.setOrigin(0,0);
    buildingTab.setScrollFactor(0);
    buildingTab.depth = 20000 - 800;
    this.tabs[TabbyState.BuildingOpen] = buildingTab;
    buildingTab.setInteractive();
    buildingTab.on('pointerdown', function(p) {});

    let buildingPanel = this.sceneRef.add.image(this.sceneRef.cameras.main.width, 0, 'uiAtlas', 'building_panel.png');
    buildingPanel.setOrigin(0,0);
    buildingPanel.setScrollFactor(0);
    buildingPanel.depth = 20000 - 800;
    this.contents[TabbyState.BuildingOpen].push(buildingPanel);
    buildingPanel.setInteractive();
    buildingPanel.on('pointerdown', function(p) {});

    this.buildingIcons = {};
    this.buildingList = buildingList;

    let self = this;
    buildingList.forEach((building, idx) => {
      let xOff = (idx % 3) * 110 + 90;
      let yOff = Math.floor(idx / 3) * 120;
      let buildingIcon = this.sceneRef.add.image(this.sceneRef.cameras.main.width + xOff, 80 + yOff, 'terrainAtlas', building.gfx_name + '.png');
      buildingIcon.setInteractive();
      this.shrinkToFit(buildingIcon, 80, 80);
      buildingIcon.setScrollFactor(0);
      buildingIcon.depth = 20000 - 800;
      this.contents[TabbyState.BuildingOpen].push(buildingIcon);
      this.buildingIcons[building.gfx_name] = buildingIcon;
      
      let buildFunc = function (pointer) {
        self.sceneRef.buildCallback(building.gfx_name);
        self.clickTab(TabbyState.BuildingOpen);
      };
      let tip = building.display_name + "\n" + building.description + "\n" + this.getBuildingCostString(building);
      this.makeToolTip(buildingIcon, tip, buildFunc);
    });

    this.updateBuildingIcons();

    buildingTab.on('pointerup', function (pointer) {
      self.clickTab(TabbyState.BuildingOpen);
    });
  }

  updateBuildingIcons() {
    this.buildingList.forEach((building) => {
      if (!this.hasRequiredSkill(building)) {
        this.buildingIcons[building.gfx_name].setTint(0x000000);
      } else if (!this.canAffordCost(building)) {
        this.buildingIcons[building.gfx_name].setTint(0x505050);
      } else {
        this.buildingIcons[building.gfx_name].setTint(0xFFFFFF);
      }
    });
  }

  getBuildingCostString(building) {
    let costString = "";
    let keys = Object.keys(building.mat_cost);
    keys.forEach(function(type, idx) {
      costString += building.mat_cost[type] + " " + type;
      if (idx < keys.length - 1) {
        costString += " / ";
      }
    });
    return costString;
  }

  canAffordCost(building) {
    return Object.keys(building.mat_cost).every((type) => Number(this.inventoryCounts[type].text.slice(2)) >= building.mat_cost[type]);
  }

  hasRequiredSkill(building) {
    return building.req_skills.every(buildSkill => this.earnedSkills.find(earnedSkill => earnedSkill == buildSkill));
  }

  clickTab(toState) {
    switch (this.state) {
      case TabbyState.Transitioning:
        return;
      case TabbyState.NoneOpen:
        this.openTab(toState);
        this.tapSfx.play();
        break;
      case toState:
        this.closeTab(toState);
        this.tapSfx.play();
        break;
      default:
        this.closeTab(this.state);
        this.openTab(toState);
        this.tapSfx.play();
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

    let heightMult = 0.65;
    if (this.tooltip.y < this.tooltip.height) {
      this.tooltip.y += this.tooltip.height;
      heightMult = 0.35;
      if (!this.tooltip.flipY) {
        this.tooltip.toggleFlipY();
      }
    } else if (this.tooltip.y >= this.tooltip.height && this.tooltip.flipY) {
      this.tooltip.toggleFlipY();
    }
    
    this.tooltipText.x = this.tooltip.x;
    this.tooltipText.y = this.tooltip.y - (this.tooltip.height * heightMult);
  }
}