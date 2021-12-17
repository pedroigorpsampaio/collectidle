import React from 'react';
import config from './config.json'
import Tile from './tile.js';
import Camera from './camera.js';
import * as Vec2D from 'vector2d';
import { PixiComponent } from './pixicomponent.js';

/**
 * Building block data
 */
class BuildBlock {
  x = 0; // the x position of building block;
  y = 0; // the y position of building block;
  placeI = null; // matrix index I to build block
  placeJ = null; // matrix index J to build block
  zIndex = 2147483646; // the z-index of building block
}

/**
 * The component for the game board/map
 * responsible for operations related to the tilemap
 */
class Board extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tiles: this.props.tiles,
      x: 0, // mouse current X position
      y: 0, // mouse current Y position
      camera: new Camera(), // creates board camera
      block: new BuildBlock(), // building block data
      isMouseDown: false, // is a mouse button currently down
      isDragging: false, // is the user currently dragging
      lastX: 0,
      lastY: 0,
      lastDragX: 0,
      lastDragY: 0,
      lastClick: 0,
    };

    // if its a new board, load initial disposition of blocks
    if (this.props.isNewBoard)
      this.loadTiles();

    //centers camera
    let center = this.getBoardCenter()
    this.state.camera.x = center.x;
    this.state.camera.y = center.y;
  }

  loadTiles() {
    const tiles = this.state.tiles.slice();
    tiles[Math.floor(config.BOARD_SIZE / 2)][Math.floor(config.BOARD_SIZE / 2)] = 0;
  }

  /**
   * Returns a Vec2D with the coordinates to center isometric map with camera at 0
   */
  getBoardCenter() {
    let j = config.BOARD_SIZE;
    let i = config.BOARD_SIZE;
    return new Vec2D.Vector(window.innerWidth * 0.70 / 2 - config.TILESIZE * this.state.camera.zoom / 2
      - (j - i) * (config.TILESIZE * this.state.camera.zoom / 2) / 2,
      window.innerHeight * 0.95 / 2 - (i + j) * (config.TILESIZE * this.state.camera.zoom / 4) / 2);
  }

  /**
   * Position camera in order to position isometric tilemap 
   * in the center of the screen 
   */
  center() {
    let j = this.state.tiles[0].length;
    let i = this.state.tiles.length;
    let center = new Vec2D.Vector(window.innerWidth * 0.70 / 2 - config.TILESIZE * this.state.camera.zoom / 2
      - (j - i) * (config.TILESIZE * this.state.camera.zoom / 2) / 2,
      window.innerHeight * 0.95 / 2 - (i + j) * (config.TILESIZE * this.state.camera.zoom / 4) / 2)
    const camera = Object.assign({}, this.state.camera);
    camera.x = center.x;
    camera.y = center.y;
    this.setState({ camera: camera });
  }

  /**
   * Get center coordinates of the isometric map current position
   */
  getCenter() {
    let j = this.state.tiles[0].length;
    let i = this.state.tiles.length;
    let offX = (j - i) * (config.TILESIZE * this.state.camera.zoom / 2) / 2;
    let offY = (i + j) * (config.TILESIZE * this.state.camera.zoom / 4) / 2;
    return new Vec2D.Vector(this.state.camera.x + offX + config.TILESIZE * this.state.camera.zoom / 2,
      this.state.camera.y + offY);
  }


  /**
   * Handles mouse up and down events
   * @param {The event that tirggered this callback} event 
   */
  handleMouseClick = (event) => {
    if (event.type === "pointerdown") {
      this.setState({ isMouseDown: true });
      let eX = event.data.global.x; let eY = event.data.global.y;
      // saves the position last clicked;
      this.setState({ lastX: eX, lastY: eY, lastDragX: eX, lastDragY: eY })
    } else {
      if (this.state.isMouseDown) { // click happened
        let t = performance.now(); // for double click
        let dT = t - this.state.lastClick;
        this.setState({ isMouseDown: false , lastClick: t});
        if(dT < 180) // double click if click happens to close to last one
          this.handleDoubleClick(event)
        else // normal click
          this.handleClick(event, event.data.global.x, event.data.global.y);
      }
    }
  }

  /**
   * handles double click events
   * @param {event} event the event that triggered the double click
   */
  handleDoubleClick(event) {
    // double click with left mouse -> center map
    if(event.data.button === 2)
      this.center();
  }

  /**
   * Handles mouse movements events
   * @param {the event data} e 
   */
  onMouseMove(e) {
    e.stopPropagation();
    //e.preventDefault()
    let eX = e.data.global.x; let eY = e.data.global.y;
    this.setState({ x: eX, y: eY });

    if (this.state.isMouseDown) {
      // drag event
      if (e.data.buttons === 2) {
        // calculates drag direction 
        const mousePos = new Vec2D.Vector(e.data.global.x, e.data.global.y);
        const lastDrag = new Vec2D.Vector(this.state.lastDragX, this.state.lastDragY);
        this.setState({ isDragging: true, lastDragX: eX, lastDragY: eY });
        const offset = mousePos.subtract(lastDrag)
        // adjusts camera accordingly
        this.updateCamera(offset)
      } else if (e.data.buttons === 1) { // if it is left click
        let isBuilding = this.props.selectedBlock > -1 ? true : false;
        if (isBuilding) // if it is building
          this.placeBlock(); // delegate block placement to the method responsible for it
      }
    } else {
      this.setState({ isDragging: false });
    }
  }

  /**
   * Updates camera's current position
   * @param {offset to be added to the camera's current position} offset 
   */
  updateCamera(offset) {
    const camera = Object.assign({}, this.state.camera);
    camera.x += offset.x;
    camera.y += offset.y;
    this.setState({ camera: camera });
  }

  /**
   * Rotates board in the desired direction orientation
   */
  rotate(direction) {
    const matrix = this.state.tiles.slice();
    const oldCenterX = this.getCenter(matrix[0]).x;

    const n = matrix.length;

    if (direction === "clockwise") { // clockwise
      for (let i = 0; i < n / 2; i++) {
        for (let j = i; j < n - i - 1; j++) {
          let tmp = matrix[i][j];
          matrix[i][j] = matrix[n - j - 1][i];
          matrix[n - j - 1][i] = matrix[n - i - 1][n - j - 1];
          matrix[n - i - 1][n - j - 1] = matrix[j][n - i - 1];
          matrix[j][n - i - 1] = tmp;
        }
      }
    }
    else { // anticlockwise
      for (let i = 0; i < n / 2; i++) {
        for (let j = i; j < n - i - 1; j++) {
          let tmp = matrix[i][j];
          matrix[i][j] = matrix[j][n - 1 - i];
          matrix[j][n - 1 - i] = matrix[n - 1 - i][n - 1 - j];
          matrix[n - 1 - i][n - 1 - j] = matrix[n - 1 - j][i];
          matrix[n - 1 - j][i] = tmp;
        }
      }
    };
    const xOffset = this.getCenter(matrix).x - oldCenterX;
    const camera = Object.assign({}, this.state.camera);
    camera.x -= xOffset;
    this.setState({ tiles: matrix, camera: camera });
  }

  /**
   * Handles click interactions in the board tiles
   * @param {e} e the event that triggered the click callback
   * @param {the x coord of the click to be handled} x 
   * @param {the y coord of the click to be handled} y 
   */
  handleClick(e, x, y) {
    let isBuilding = this.props.selectedBlock > -1 ? true : false;
    if (!this.state.isDragging && !isBuilding) {
      const tiles = this.state.tiles.slice();

      // dont mess with undefined
      if (typeof tiles == "undefined")
        return;

      var idx = this.convertToMap(x, y);
      var i = Math.floor(idx[0]);
      var j = Math.floor(idx[1]);

      // precision calculation to consider only the top plane of cube
      let topFactor = this.getTopFactor(i, j, x, y);

      // if it hits some existing block
      if (tiles[i][j] !== 0) {

        // Click on a valid cube plane!!! Success!!!!!
        if (topFactor > 0 && topFactor <= 1) {
          // tiles[i][j] = 0; // updates it
          console.log("clicked on [" + i + ", " + j + "]");
        }

      }

      // updates layers in game state
      this.setState({ tiles: tiles });
    } else if (isBuilding && e.data.button === 0) { // is in building mode (able to place blocks)
      this.placeBlock();
    }
  }

  /**
   * Converts coordinates in the screen space (X,Y) of the page
   * to the map coordinates (i,j)
   * @param {The x - the x coordinate to be converted to map index j } screenX 
   * @param {The y - the y coordinate to be converted to map index i } screenY 
   * @param {*} limit if calculations should be limited by board boundaries (default = true)
   */
  convertToMap(screenX, screenY, limit = true) {
    let TILESIZE_Z = config.TILESIZE * this.state.camera.zoom;
    let TILE_HALF = TILESIZE_Z / 2;

    let x = screenX - TILE_HALF - this.state.camera.x;
    let y = screenY - this.state.camera.y;
    let i = Math.trunc((y / TILE_HALF) - (x / TILESIZE_Z));
    let j = Math.trunc((y / TILE_HALF) + (x / TILESIZE_Z));

    // limits i and j to be inside board boundaries
    if (limit) {
      // makes sure we do not surpass the map 2darray limits
      if (i < 0) i = 0; if (i >= this.state.tiles.length) i = this.state.tiles.length - 1;
      if (j < 0) j = 0; if (j >= this.state.tiles[0].length) j = this.state.tiles[0].length - 1;
    }

    return [i, j];
  }

  /**
   * Returns a value that indicates if a point is within
   * the top plane of a given tile in the map
   * (the factor indicates it is in top plane when its value is between 0 and 1)
   * @param {*} i the i-index of the tile to be checked
   * @param {*} j the j-index of the tile to be checked
   * @param {*} screenX the x-index of the mouse click in the page
   * @param {*} screenY the y-index of the mouse click in the page
   * @returns factor that indicates if click is in top plane when its value is between 0 and 1 
   *          or out of the top plane when it is not
   */
  getTopFactor(i, j, screenX, screenY) {
    /**
    * tx,ty: coordinates of the tile in page (top-left orientation)
    * tcx,tcy: coordinates of the middle of the tile
    * cx, cy: coordinates of the click in the page
    * offsetX,Y: offset relation between click and middle of the tile
    * topFactor: factor from that indicates when click is on the top plane of cube (from 0 to 1 = click in top plane)
    */
    let tx = (j - i) * (config.TILESIZE * this.state.camera.zoom / 2) + this.state.camera.x;
    let ty = (i + j) * (config.TILESIZE * this.state.camera.zoom / 4) + this.state.camera.y;
    let cx = screenX;
    let cy = screenY;
    let tcy = ty + (config.TILESIZE * this.state.camera.zoom / 4);
    let tcx = tx + (config.TILESIZE * this.state.camera.zoom / 2);
    let offsetY = Math.abs(cy - tcy) * 2;
    let offsetX = Math.abs(cx - tcx);
    return (offsetX + offsetY) / ((config.TILESIZE * this.state.camera.zoom / 4) + (config.TILESIZE * this.state.camera.zoom / 4));
  }

  /**
   * Renders the tile
   * @param {The i-index of the tile} i 
   * @param {The j-index of the tile} j 
   */
  renderTile(i, j, key) {
    return (
      <Tile
        value={this.state.tiles[i][j]}
        key={key}
        camera={this.state.camera}
        zIndex={i + j + 2}
        top={(i + j) * (config.TILESIZE * this.state.camera.zoom / 4) + this.state.camera.y}
        left={(j - i) * (config.TILESIZE * this.state.camera.zoom / 2) + this.state.camera.x}
      />
    )

  }

  // renders projection ofselected tile on tilemap on mouse move position
  // and updates placement position valid candidates in case of user click
  updateProjection() {
    const tiles = this.state.tiles.slice();
    const mX = this.state.x;
    const mY = this.state.y;
    var top = mY - this.state.camera.zoom * config.TILESIZE / 4;
    var left = mX - this.state.camera.zoom * config.TILESIZE / 2;
    // placement position (null if not valid)
    var placeI = null; var placeJ = null; var zIndex = 2147483646;

    var idx = this.convertToMap(this.state.x, this.state.y);
    var i = Math.floor(idx[0]);
    var j = Math.floor(idx[1]);

    // precision calculation
    let topFactor = this.getTopFactor(i, j, this.state.x, this.state.y);

    if (tiles[i][j] !== -1) {  // borders of board
      if (topFactor >= 1 && topFactor <= 3) { // is within acceptable distance of border and has neighbour
        idx = this.convertToMap(this.state.x, this.state.y, false); // gets position 
        i = Math.floor(idx[0]);
        j = Math.floor(idx[1]);
        const oldI = i; const oldJ = j; // stores preprojection pos with limit at 0

        if (1 / i === -Infinity) i--; // correction to project with i < 0
        if (1 / j === -Infinity) j--; // correction to project with j < 0

        if (!this.isAtCorner(i, j)) {
          top = (i + j) * (config.TILESIZE * this.state.camera.zoom / 4) + this.state.camera.y
          left = (j - i) * (config.TILESIZE * this.state.camera.zoom / 2) + this.state.camera.x
          placeI = oldI; placeJ = oldJ; // updates placement indexes with a valid placement position
          zIndex = i + j + 2;
        }
      }
    } else { // empty slot is a valid position if there is a neighbour tile
      const hasNeighbour = this.hasNeighbour(i, j);

      // if is within the projected top plane of cube to be placed and has a neighbour
      if (topFactor > 0 && topFactor <= 1 && hasNeighbour) {
        //console.log("Im a valid poisition to place block");
        top = (i + j) * (config.TILESIZE * this.state.camera.zoom / 4) + this.state.camera.y
        left = (j - i) * (config.TILESIZE * this.state.camera.zoom / 2) + this.state.camera.x
        placeI = i; placeJ = j; // updates placement indexes with a valid placement position
        zIndex = i + j + 2;
      }
    }

    // updates block data
    const block = Object.assign({}, this.state.block);
    block.placeI = placeI; block.placeJ = placeJ;
    block.x = left; block.y = top; block.zIndex = zIndex;
    this.setState({block:block});
    return block;
  }

  /**
   * Return if a tile in a given position (i,j) has a valid neighbour (value != 0)
   * @param {*} i the i-index of the tile to check neighbours
   * @param {*} j the j-index of the tile to check neighbours
   */
  hasNeighbour(i, j) {
    const tiles = this.state.tiles.slice();
    const left = j - 1 >= 0 ? (tiles[i][j - 1] !== -1 ? true : false) : false;
    const right = j + 1 < tiles[i].length ? (tiles[i][j + 1] !== -1 ? true : false) : false;
    const up = i - 1 >= 0 ? (tiles[i - 1][j] !== -1 ? true : false) : false;
    const down = i + 1 < tiles.length ? (tiles[i + 1][j] !== -1 ? true : false) : false;
    return left || right || up || down;
  }

  /**
   * Check if it is at the corner of board (outside tiles that are attached to one of the four board corners)
   * @param {*} i the i-index of the tile to check if it is at board boundaries corner
   * @param {*} j the j-index of the tile to check if it is at board boundaries corner
   */
  isAtCorner(i, j) {
    const tiles = this.state.tiles.slice();
    const upLeft = j === -1 ? (i === -1 ? true : false) : false;
    const upRight = j === tiles[0].length ? (i === -1 ? true : false) : false;
    const downLeft = j === -1 ? (i === tiles.length ? true : false) : false;
    const downRight = j === tiles[0].length ? (i === tiles.length ? true : false) : false;
    return upLeft || upRight || downLeft || downRight;
  }

  /**
   * Place block in the stored placement position
   */
  placeBlock() {
    let i = this.state.block.placeI; let j = this.state.block.placeJ;
    let valid = i != null ? (j != null ? (i >= 0 ? (j >= 0 ? (i < config.BOARD_SIZE ?
      (j < config.BOARD_SIZE ? true : false) : false)
      : false) : false) : false) : false;
    if (valid) { // has a valid place to place block
      const tiles = this.state.tiles.slice();
      tiles[i][j] = this.props.selectedBlock;
      this.props.resetBlock();
      this.setState({ tiles: tiles });
    }
  }

  // change zoom based on mwheel
  onWheel(e) {
    let scroll = -e.deltaY / 3200;

    if ((this.state.camera.zoom + scroll) > this.state.camera.min_zoom &&
      (this.state.camera.zoom + scroll) <= this.state.camera.max_zoom) {
      const camera = Object.assign({}, this.state.camera);
      const oldZoom = camera.zoom;
      camera.zoom += scroll;
      const newZoom = camera.zoom;
      const oldHeight = config.TILESIZE * config.BOARD_SIZE * oldZoom;
      const newHeight = config.TILESIZE * config.BOARD_SIZE * newZoom;
      const dH = newHeight - oldHeight;
      camera.y = camera.y - dH / 4;
      this.setState({ camera: camera });
    }
  }

  render() {
    return (
      <div>
        <div className='game-board'> 
          <PixiComponent onMouseDown={this.handleMouseClick}
            onMouseUp={this.handleMouseClick}
            onMouseMove={this.onMouseMove.bind(this)}
            onWheel={this.onWheel.bind(this)}
            onRotateAntiBtn={() => this.rotate("anticlockwise")}
            onCenterBtn={this.center.bind(this)}
            onRotateBtn={() => this.rotate("clockwise")}
            updateProjection={this.updateProjection.bind(this)}
            state={this.state}
            selectedBlock={this.props.selectedBlock}
            blocksSheet={this.props.blocksSheet} blocksData={this.props.blocksData}/>
        </div>
        {/* <button className="rotate-button" onClick={() => this.rotate("anticlockwise")}>Anti-clockwise</button>
        <button className="rotate-button" onClick={() => this.rotate("clockwise")}>Clockwise</button>
        <button className="center-button" onClick={() => this.center()}>Center</button> */}
      </div>
    );
  }

  /**
   * Called when component is mounted
   */
  componentDidMount() {
    window.addEventListener('resize', this.resize);
    this.forceUpdate();
    //this.loadTiles(); // load initial tiles
  }

  /**
   * Called when component is unmounted
   */
  componentWillUnmount() {
    window.removeEventListener('resize', this.resize);
  }
}

export default Board;


/**
 * Creates and fills multidimensional arrays with
 * a default value
 * Mohammed Ashfaq @ StackOverflow
 * @param rows The number of rows for the array
 * @param columns The number of columns for the array
 * @param defaultValue The default value for each field of the array
 * @returns The newly created multidimensional array populated with the default value
 */
// function createAndFill2DArray({rows, columns, defaultValue}){
//     return Array.from({ length:rows }, (e, i) => (
//     Array.from({ length:columns }, (e, j)=> defaultValue)));
// }