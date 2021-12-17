import * as React from 'react';
import * as PIXI from 'pixi.js';
import emptyTile from './assets/0.png';
import btnSheet from './assets/buttons/buttons.png';
import btnSheetJson from './assets/buttons/buttons.json';
import config from './config.json';
import * as Vec2D from 'vector2d';
import background from './assets/backgrounds/bg_world.gif';

export class PixiComponent extends React.Component {
  /**
   * After mounting, add the Pixi Renderer to the div and start the Application.
   */
  componentDidMount() {
    this.camera = this.props.state.camera;
    this.tiles = this.props.state.tiles;
    this.selectedBlock = this.props.selectedBlock;
    this.isBuilding = this.selectedBlock > -1 ? true : false;
    this.blocksSheet = this.props.blocksSheet; this.blocksData = this.props.blocksData;

    this.app = new PIXI.Application({ 
      width: window.innerWidth*0.70, height: window.innerHeight*0.95, 
      backgroundAlpha: 0, 
    });
    document.body.appendChild(this.app.view);
    this.app.view.style.position = 'absolute';this.app.view.style.left = '20px';this.app.view.style.top = '20px';

    // creates and renders background
    this.renderBackground();
    // create tiles and sprites container
    this.container = new PIXI.Container();
    this.container.sortableChildren = true;
    this.app.stage.addChild(this.container);
    
    // Create empty slot texture
    this.emptyTex = PIXI.Texture.from(emptyTile);

    // loads buttons spritesheet and render them when loading is complete
    this.loader = new PIXI.Loader();
    this.renderButtons();

    // creates blocks spritesheet and render them
    const baseTexture = PIXI.BaseTexture.from(this.props.blocksSheet);
    this.blSheet = new PIXI.Spritesheet(baseTexture, this.props.blocksData);
    this.blSheet.parse(() => {
      Object.keys(this.blSheet.textures).map((t) => this.blSheet.textures[t]);
    });

    // renders tilemap
    this.renderTilemap();

    // border
    this.border = new PIXI.Graphics();

    // set the line style to have a width of 5 and set the color to red
    this.border.lineStyle(2, 0x000000);

    // draw a rectangle border
    this.border.drawRect(this.app.screen.x, this.app.screen.y+1, this.app.screen.width-1, this.app.screen.height-2);
    this.app.stage.addChild(this.border);

    // mouse interation callbacks
    this.app.stage.interactive = true;
    this.app.stage.on("pointerdown", (e) => this.props.onMouseDown(e));
    this.app.stage.on("pointerup", (e) => this.props.onMouseUp(e));
    this.app.stage.on("pointermove", (e) => this.props.onMouseMove(e));
    //window.addEventListener("wheel", (e) => this.props.onWheel(e));
    window.addEventListener('resize', (e) => this.resize());
    this.app.renderer.view.addEventListener('wheel', (e) => this.props.onWheel(e));
    
    // Listen for animate update
    this.app.ticker.add((delta) => {
      this.update(delta);
    });
  }

  /**
   * Perform updates based on changes that happened since last tick
   * @param {delta} delta the delta time from last tick
   */
  update(delta) {
    // updates data sent via props
    this.camera = this.props.state.camera;
    this.tiles = this.props.state.tiles;
    this.selectedBlock = this.props.selectedBlock;
    this.isBuilding = this.selectedBlock > -1 ? true : false;
    this.blocksSheet = this.props.blocksSheet; this.blocksData = this.props.blocksData;
    this.block = this.props.state.block;

    // clears container
    this.container.removeChildren();
    // start rendering 
    this.renderTilemap(); // render tilemap
    if(this.isBuilding) { // if it is in building mode
      this.block = this.props.updateProjection(); // updates projection via props method
      if(this.isOnScreen(this.block, config.TILESIZE*this.camera.zoom, config.TILESIZE*this.camera.zoom))
        this.renderProjection(); // render projection (if its on screen)
    }
  }
  
  /**
   * Stop the Application when unmounting.
   */
  componentWillUnmount() {
    this.app.stop();
  }

  /**
   * Checks if an entity is on viewport screen
   * @param {*} entity the entity to check
   */
  isOnScreen(entity, width, height) {
    let onScreen = !((entity.x > this.app.screen.width) || (entity.x < this.app.screen.x-(width)) ||
                      entity.y > this.app.screen.height || (entity.y < this.app.screen.y-(height)));
    return onScreen;
  }

  /**
   * Returns a Vec2D with the coordinates to center isometric map with camera at 0
   */
  getBoardCenter() {
    let j = config.BOARD_SIZE;
    let i = config.BOARD_SIZE;
    return new Vec2D.Vector(this.app.screen.width/2 - config.TILESIZE*this.camera.zoom/2 
                                                      - (j-i)*(config.TILESIZE*this.camera.zoom/2)/2, 
                                                      this.app.screen.height*0.95/2 - (i+j)*(config.TILESIZE*this.camera.zoom/4)/2);
  }

  // create and renders background
  renderBackground() {
    // first set the texture
    this.bgTex = new PIXI.Texture.from(background);
    // create the sprite
    this.bgSprite = new PIXI.Sprite(this.bgTex);
    // set the width of the sprite
    this.bgSprite.width = this.app.screen.width;
    this.bgSprite.height = this.app.screen.height;
    // finally add the new sprite
    this.app.stage.addChild(this.bgSprite);
  }

  // create and renders buttons
  renderButtons() {
    // builds buttons spritesheet
    const baseTexture = PIXI.BaseTexture.from(btnSheet);
    const sheet = new PIXI.Spritesheet(baseTexture, btnSheetJson);
    sheet.parse(() => {
      Object.keys(sheet.textures).map((t) => sheet.textures[t]);
    });
    // create the rotate anticlockwise btn sprite
    this.rotateAntiBtn = new PIXI.Sprite(sheet.textures["LeftArrow (1).png"]);
    this.rotateAntiBtn.interactive = true;
    this.rotateAntiBtn.buttonMode = true;
    // create the center btn sprite
    this.centerBtn = new PIXI.Sprite(sheet.textures["Home (1).png"]);
    this.centerBtn.interactive = true;
    this.centerBtn.buttonMode = true;
    // create the rotate clockwise btn sprite
    this.rotateBtn = new PIXI.Sprite(sheet.textures["RightArrow (1).png"]);
    this.rotateBtn.interactive = true;
    this.rotateBtn.buttonMode = true;
    // set the position and dimensions 
    this.rotateAntiBtn.position.x = 30
    this.rotateAntiBtn.position.y = 30;
    this.rotateAntiBtn.width = 30;
    this.rotateAntiBtn.height = 30;

    this.centerBtn.position.x = this.rotateAntiBtn.position.x + this.rotateAntiBtn.width + 10;
    this.centerBtn.position.y = this.rotateAntiBtn.position.y;
    this.centerBtn.width = 30;
    this.centerBtn.height = 30;
    
    this.rotateBtn.position.x = this.centerBtn.position.x + this.rotateAntiBtn.width + 10;
    this.rotateBtn.position.y = this.centerBtn.position.y;
    this.rotateBtn.width = 30;
    this.rotateBtn.height = 30;
    // set the callbacks
    this.rotateAntiBtn.on("pointerdown", (e) => {e.stopPropagation(); this.rotateAntiBtn.tint=0x1FC012});
    this.rotateAntiBtn.on("pointerout", (e) => {e.stopPropagation(); this.rotateAntiBtn.tint=0xFFFFFF});
    this.rotateAntiBtn.on("pointerup", (e) => {e.stopPropagation(); this.rotateAntiBtn.tint=0xFFFFFF});
    this.rotateAntiBtn.on("click", (e) => this.props.onRotateAntiBtn(e));

    this.centerBtn.on("pointerdown", (e) => {e.stopPropagation(); this.centerBtn.tint=0x1FC012});
    this.centerBtn.on("pointerout", (e) => {e.stopPropagation(); this.centerBtn.tint=0xFFFFFF});
    this.centerBtn.on("pointerup", (e) => {e.stopPropagation(); this.centerBtn.tint=0xFFFFFF});
    this.centerBtn.on("click", (e) => this.props.onCenterBtn(e));

    this.rotateBtn.on("pointerdown", (e) => {e.stopPropagation(); this.rotateBtn.tint=0x1FC012});
    this.rotateBtn.on("pointerout", (e) => {e.stopPropagation(); this.rotateBtn.tint=0xFFFFFF});
    this.rotateBtn.on("pointerup", (e) => {e.stopPropagation(); this.rotateBtn.tint=0xFFFFFF});
    this.rotateBtn.on("click", (e) => this.props.onRotateBtn(e));
    // finally add the new button
    this.app.stage.addChild(this.rotateAntiBtn);
    this.app.stage.addChild(this.centerBtn);
    this.app.stage.addChild(this.rotateBtn);
  }

  /**
   * Render projected tile for building blocks mode
   */
  renderProjection() {
    // create and add block projection to the container
    const block = new PIXI.Sprite(this.blSheet.textures[this.selectedBlock+".png"]);
    block.zIndex = this.block.zIndex;
    block.x = this.block.x;
    block.y = this.block.y;
    block.alpha = 0.5;
    block.blendMode = PIXI.BLEND_MODES.ADD;
    block.width = config.TILESIZE*this.camera.zoom;
    block.height = config.TILESIZE*this.camera.zoom;
    this.container.addChild(block);
  }

  /**
   * Do some culling directly on loop scope
   * to render only visible tiles and renders them 
   */
  renderTilemap() {
    let tZ= config.TILESIZE*this.camera.zoom;
    let dX = this.camera.x - this.getBoardCenter().x;
    let dY = this.camera.y - this.getBoardCenter().y;
    let dTileX = Math.round(dX / (tZ/2));
    let dTileY = Math.round(dY / (tZ/2));
    let dInitY = Math.ceil(config.BOARD_SIZE / (2));
    let centerTile = [Math.round(config.BOARD_SIZE/2), Math.round(config.BOARD_SIZE/2)];
    let nCols = Math.ceil(this.app.screen.width / (tZ/2))+3;
    let nRows = Math.ceil(this.app.screen.height / (tZ/2))+4;
    let minI = (centerTile[0]+centerTile[1]-dTileY-dInitY) - (Math.ceil(nRows/2)); let maxI = (centerTile[0]+centerTile[1]-dTileY-dInitY) + (Math.ceil(nRows/2));
    let minJ = (centerTile[0]-centerTile[1]-dTileX) - (Math.ceil(nCols/2)); let maxJ = (centerTile[0]-centerTile[1]-dTileX) + (Math.ceil(nCols/2));

    // loops only in the visible scope of tiles
    for(let i = minI; i < maxI; i++) {
      for(let j = minJ; j < maxJ; j++) {
        let x = Math.round(i+j/2); // conversion to find the correct tile index visible
        let y = Math.round(i-j/2); 
        // border control
        if(x<0 || x>=config.BOARD_SIZE || y<0 || y>= config.BOARD_SIZE) continue;
        // if its not in building mode and there is no tile, do not draw demarcation tiles 
        if(!this.isBuilding && this.tiles[y][x] === -1) continue;
        // create and add tile to the container
        const tile = this.tiles[y][x] > -1 ? new PIXI.Sprite(this.blSheet.textures[this.tiles[y][x]+".png"]) : 
                                              new PIXI.Sprite(this.emptyTex);
        tile.zIndex = y+x+2;
        tile.x = (x-y)*(config.TILESIZE*this.camera.zoom/2) + this.camera.x;
        tile.y = (y+x)*(config.TILESIZE*this.camera.zoom/4) + this.camera.y;
        tile.alpha = this.tiles[y][x] > -1 ? 1 : 0.25;
        tile.blendMode = PIXI.BLEND_MODES.NORMAL;
        tile.width = config.TILESIZE*this.camera.zoom;
        tile.height = config.TILESIZE*this.camera.zoom;
        this.container.addChild(tile);
      }
    }
  }

  /**
   * Simply render the div that will contain the Pixi Renderer.
   */
  render() {
    let component = this;
    return (
      <div ref={(thisDiv) => {component.gameCanvas = thisDiv}} />
    );
  }

  // Resize the renderer when window resize happens
  resize() {
    // calculates delta in dimensions
    let oldW = this.app.renderer.width;
    let oldH = this.app.renderer.height;
    let targetW = Math.round(window.innerWidth*0.70);
    let targetH = Math.round(window.innerHeight*0.95);
    let deltaW = targetW - oldW;
    let deltaH = targetH - oldH;
    // updates camera position
    this.camera.x += deltaW/2;
    this.camera.y += deltaH/2;
    // resizes renderer
    this.app.renderer.resize(targetW, targetH);
    // resizes background
    this.bgSprite.width = this.app.screen.width;
    this.bgSprite.height = this.app.screen.height;
    // resizes border
    this.border.clear();
    // set the line style to have a width of 5 and set the color to red
    this.border.lineStyle(2, 0x000000);
    this.border.drawRect(this.app.screen.x+1, this.app.screen.y+1, this.app.screen.width-1, this.app.screen.height-2);
  }
  
}