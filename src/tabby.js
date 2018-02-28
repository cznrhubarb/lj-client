const TabbyState = { NoneOpen: 1, InventoryOpen: 2, SkillOpen: 3, BuildingOpen: 4, Transitioning: 5 }

export default class Tabby {
  constructor(sceneRef) {
    this.sceneRef = sceneRef;
    this.tabs = {};
    this.icons = {};
    this.contents = { [TabbyState.InventoryOpen]: [], [TabbyState.SkillOpen]: [], [TabbyState.BuildingOpen]: [] };
    this.inventoryCounts = {};

    this.createInventoryTab(sceneRef);
    this.createSkillTab(sceneRef);
    this.createBuildingTab(sceneRef);

    this.xIcon = sceneRef.add.sprite(800-100, 15, 'x');
    this.xIcon.setScrollFactor(0);
    this.xIcon.depth = Number.MAX_VALUE;
    this.xIcon.alpha = 0;

    this.state = TabbyState.NoneOpen;
  }

  createInventoryTab() {
    let inventoryTab = this.sceneRef.add.sprite(800-75, 0, 'inventoryTab');
    inventoryTab.setOrigin(0,0);
    inventoryTab.setScrollFactor(0);
    inventoryTab.depth = Number.MAX_VALUE;
    this.tabs[TabbyState.InventoryOpen] = inventoryTab;
    
    let inventoryIcon = this.sceneRef.add.sprite(800-35, 45, 'backpack');
    inventoryIcon.setInteractive();
    inventoryIcon.setScrollFactor(0);
    inventoryIcon.depth = Number.MAX_VALUE;
    this.icons[TabbyState.InventoryOpen] = inventoryIcon;
    this.contents[TabbyState.InventoryOpen].push(inventoryIcon);
    
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
    inventoryIcon.on('pointerup', function (pointer) {
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
    let skillTab = this.sceneRef.add.sprite(800-75, 0, 'skillTab');
    skillTab.setOrigin(0,0);
    skillTab.setScrollFactor(0);
    skillTab.depth = Number.MAX_VALUE;
    this.tabs[TabbyState.SkillOpen] = skillTab;

    let skillIcon = this.sceneRef.add.sprite(800-35, 120, 'axe');
    skillIcon.setInteractive();
    skillIcon.setScrollFactor(0);
    skillIcon.depth = Number.MAX_VALUE;
    this.icons[TabbyState.SkillOpen] = skillIcon;
    this.contents[TabbyState.SkillOpen].push(skillIcon);

    let self = this;
    skillIcon.on('pointerup', function (pointer) {
      self.clickTab(TabbyState.SkillOpen);
    });
  }

  createBuildingTab() {
    let buildingTab = this.sceneRef.add.sprite(800-75, 0, 'buildingTab');
    buildingTab.setOrigin(0,0);
    buildingTab.setScrollFactor(0);
    buildingTab.depth = Number.MAX_VALUE;
    this.tabs[TabbyState.BuildingOpen] = buildingTab;

    let buildingIcon = this.sceneRef.add.sprite(800-35, 195, 'building');
    buildingIcon.setInteractive();
    buildingIcon.setScrollFactor(0);
    buildingIcon.depth = Number.MAX_VALUE;
    this.icons[TabbyState.BuildingOpen] = buildingIcon;
    this.contents[TabbyState.BuildingOpen].push(buildingIcon);

    let self = this;
    buildingIcon.on('pointerup', function (pointer) {
      self.clickTab(TabbyState.BuildingOpen);
    });
  }

  // TODO: Block input so that the player isn't walking while looking at their inventory
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
    let icon = this.icons[state];
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
    let icon = this.icons[state];
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
}