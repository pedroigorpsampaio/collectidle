import React from 'react';
import config from './config.json'
import Tile from './tile.js';
import Camera from './camera.js';
import background from './assets/backgrounds/bg_world.gif';
import * as Vec2D from 'vector2d';


/**
 * Viewport data of this component (board)
 */
class Viewport {
  offset_x = 0; // the x offset of the board in the page
  offset_y = 0; // the y offset of the board in the page
  width = 0; // the viewport width of the game board
  height = 0; // the viewport height of the game board
  rfWidth = 0; // viewport width of last frame rendered
  rfHeight = 0; // viewport height of last frame rendered
}

/**
 * The component for the game board/map
 * responsible for operations related to the tilemap
 */
class Board extends React.Component {
    constructor(props) {
      super(props);   
      // sets game world background

      this.placeI = null; // placement I index (null if not valid)
      this.placeJ = null; // placement J index (null if not valid)
      this.viewport = new Viewport(); // creates viewport object later to be fulfilled 

      this.state = {
        tiles: createAndFill2DArray({rows:config.BOARD_HEIGHT, columns:config.BOARD_WIDTH, defaultValue: '0'}),
        x: 0,
        y: 0,
        camera: new Camera(), // creates board camera
        isMouseDown: false,
        isDragging: false,
        isBuilding: false,
        selectedTile: 1,
        lastX: 0,
        lastY: 0,
        lastDragX: 0,
        lastDragY: 0
      };

      //centers camera
      let center = this.getBoardCenter()
      this.state.camera.x = center.x;
      this.state.camera.y = center.y;
    }
      
    /**
     * Returns a Vec2D with the coordinates to center isometric map with camera at 0
     */
    getBoardCenter() {
      let j = config.BOARD_WIDTH;
      let i = config.BOARD_HEIGHT;
      return new Vec2D.Vector(window.innerWidth*0.70/2 - config.TILESIZE*this.state.camera.zoom/2 
                                                        - (j-i)*(config.TILESIZE*this.state.camera.zoom/2)/2, 
                              window.innerHeight*0.95/2 - (i+j)*(config.TILESIZE*this.state.camera.zoom/4)/2);
    }

    /**
     * Position camera in order to position isometric tilemap 
     * in the center of the screen 
     */
    center() {
      let j = this.state.tiles[0].length;
      let i = this.state.tiles.length;
      let center = new Vec2D.Vector(window.innerWidth*0.70/2 - config.TILESIZE*this.state.camera.zoom/2 
                                                        - (j-i)*(config.TILESIZE*this.state.camera.zoom/2)/2, 
                              window.innerHeight*0.95/2 - (i+j)*(config.TILESIZE*this.state.camera.zoom/4)/2)
      const camera = Object.assign({}, this.state.camera);                        
      camera.x = center.x;
      camera.y = center.y;
      this.setState({camera: camera});
    }

    /**
     * Get center coordinates of the isometric map current position
     */
    getCenter() {
      let j = this.state.tiles[0].length;
      let i = this.state.tiles.length;
      let offX = (j-i)*(config.TILESIZE*this.state.camera.zoom/2)/2;
      let offY = (i+j)*(config.TILESIZE*this.state.camera.zoom/4)/2;
      return new Vec2D.Vector(this.state.camera.x + offX + config.TILESIZE*this.state.camera.zoom/2, 
                                            this.state.camera.y + offY);
    }
    
  
    /**
     * Handles mouse up and down events
     * @param {The event that tirggered this callback} event 
     */
    handleMouseClick = (event) => {
      if (event.type === "mousedown") {
             this.setState({ isMouseDown: true});
             // saves the position last clicked;
             this.setState({lastX: event.pageX, lastY: event.pageY, lastDragX: event.pageX, lastDragY: event.pageY})         
         } else {
             this.setState({ isMouseDown: false});
         }
     }
  
     /**
      * Handles mouse movements events
      * @param {the event data} e 
      */
    onMouseMove(e) {
      e.preventDefault()
      this.setState({x: e.pageX, y: e.pageY });
     
      if(this.state.isMouseDown) {
        // drag event
        if(e.buttons === 2) {
          this.setState({isDragging: true, lastDragX: e.pageX, lastDragY: e.pageY});
          // calculates drag direction 
          const mousePos = new Vec2D.Vector(e.pageX, e.pageY);
          const lastDrag = new Vec2D.Vector(this.state.lastDragX, this.state.lastDragY);
          const offset = mousePos.subtract(lastDrag)
          // adjusts camera accordingly
          this.updateCamera(offset)
        }
      } else {
        this.setState({isDragging: false});
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
      this.setState({camera:camera});   
    }
  
    /**
     * Rotates board in the desired direction orientation
     */
    rotate(direction) {
      const matrix = this.state.tiles.slice();
      const oldCenterX = this.getCenter(matrix[0]).x;

      const rows = matrix.length, cols = matrix[0].length;
      const grid = [];
      for (let j = 0; j < cols; j++) {
        grid[j] = Array(rows);
      }
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          let dirI = direction === "clockwise" ? rows-i-1 : i; 
          let dirJ = direction === "clockwise" ? j : cols-j-1;
          grid[j][i] = matrix[dirI][dirJ];
        }
      }
      const tiles = grid.slice();
       
      const xOffset = this.getCenter(tiles).x - oldCenterX;
      const camera = Object.assign({}, this.state.camera); 
      camera.x -= xOffset;
      this.setState({tiles: tiles, camera:camera});  
    }
  
    /**
     * Handles click interactions in the board tiles
     * @param {the x coord of the click to be handled} x 
     * @param {the y coord of the click to be handled} y 
     */
    handleClick(x, y) {
      if(!this.state.isDragging && !this.state.isBuilding) {
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
        if(tiles[i][j] !== 0) {     
          
          // Click on a valid cube plane!!! Success!!!!!
          if(topFactor > 0 && topFactor <= 1) {
            tiles[i][j] = 0; // updates it
          } 

        }

        // updates layers in game state
        this.setState({tiles: tiles});
      } else if(this.state.isBuilding) { // is in building mode (able to place blocks)
        let i = this.placeI; let j = this.placeJ;
        if(i != null && j != null) { // has a valid place to place block
          //const tiles = this.state.tiles.slice();
          //tiles[i].splice(j, 0, this.state.selectedTile);
          //console.log(i);
        }
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
  
      let x = screenX - TILE_HALF - this.state.camera.x - this.viewport.offset_x;
      let y = screenY - this.state.camera.y - this.viewport.offset_y
      let i = Math.trunc((y/TILE_HALF) - (x/TILESIZE_Z));
      let j = Math.trunc((y/TILE_HALF) + (x/TILESIZE_Z));

      // limits i and j to be inside board boundaries
      if(limit) {
      // makes sure we do not surpass the map 2darray limits
        if (i < 0) i = 0; if(i>=this.state.tiles.length) i = this.state.tiles.length-1;
        if (j < 0) j = 0; if(j>=this.state.tiles[0].length) j = this.state.tiles[0].length-1;
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
      let tx =(j-i)*(config.TILESIZE*this.state.camera.zoom/2) + this.state.camera.x;
      let ty =(i+j)*(config.TILESIZE*this.state.camera.zoom/4) + this.state.camera.y;
      let cx = screenX - this.viewport.offset_x;
      let cy = screenY - this.viewport.offset_y;
      let tcy = ty + (config.TILESIZE*this.state.camera.zoom/4);
      let tcx = tx + (config.TILESIZE*this.state.camera.zoom/2);
      let offsetY = Math.abs(cy - tcy) * 2;
      let offsetX = Math.abs(cx - tcx);
      return (offsetX+offsetY)/((config.TILESIZE*this.state.camera.zoom/4)+(config.TILESIZE*this.state.camera.zoom/4));
    }

    /**
     * Renders tile map by rendering its rows and columns.
     * Calculates which tiles are visible in the viewport
     * and then calls the method to render the tile
     */
    renderTilemap() {
      let rows = [];
      let tZ= config.TILESIZE*this.state.camera.zoom;
      let dX = this.state.camera.x - this.getBoardCenter().x;
      let dY = this.state.camera.y - this.getBoardCenter().y;
      let dTileX = Math.round(dX / (tZ/2));
      let dTileY = Math.round(dY / (tZ/2));
      let dInitY = Math.ceil(config.BOARD_HEIGHT / (2));
      let centerTile = [Math.round(config.BOARD_WIDTH/2), Math.round(config.BOARD_HEIGHT/2)];
      let nCols = Math.ceil(this.viewport.width / (tZ/2))+3;
      let nRows = Math.ceil(this.viewport.height / (tZ/2))+2;
      let minI = (centerTile[0]+centerTile[1]-dTileY-dInitY) - (Math.ceil(nRows/2)); let maxI = (centerTile[0]+centerTile[1]-dTileY-dInitY) + (Math.ceil(nRows/2));
      let minJ = (centerTile[0]-centerTile[1]-dTileX) - (Math.ceil(nCols/2)); let maxJ = (centerTile[0]-centerTile[1]-dTileX) + (Math.ceil(nCols/2));

      for(let i = minI; i < maxI; i++) {
        for(let j = minJ; j < maxJ; j++) {
          let x = Math.round(i+j/2);
          let y = Math.round(i-j/2);
 
          if(x<0 || x>=config.BOARD_WIDTH || y<0 || y>= config.BOARD_HEIGHT) continue;

          // only push to be rendered if its not an empty tile slot
          if(this.state.tiles[y][x] !== 0)
            rows.push(<span key = {rows.length}>{this.renderTile(y,x)}</span>);
        }
      }
      // updates viewport dimensions of this rendered frame
      this.viewport.rfWidth = this.viewport.width; this.viewport.rfHeight = this.viewport.height;
      return rows;
    }
   
    /**
     * Renders the tile
     * @param {The i-index of the tile} i 
     * @param {The j-index of the tile} j 
     */
    renderTile(i, j) {
      return (
        <Tile 
          value={this.state.tiles[i][j]} 
          //onClick={() => this.handleClick(i, j)}
          camera = {this.state.camera}
          zIndex = {i+j+2}
          top={(i+j)*(config.TILESIZE*this.state.camera.zoom/4) + this.state.camera.y}
          left={(j-i)*(config.TILESIZE*this.state.camera.zoom/2) + this.state.camera.x}
        />
      )
      
    }

    // renders projection ofselected tile on tilemap on mouse move position
    // and updates placement position valid candidates in case of user click
    renderProjection () {
      const tiles = this.state.tiles.slice();
      const mX = this.state.x - this.viewport.offset_x;
      const mY = this.state.y - this.viewport.offset_y
      var top = mY - this.state.camera.zoom*config.TILESIZE/4;
      var left = mX - this.state.camera.zoom*config.TILESIZE/2;
      var opacity = 0.5;
      // placement position (null if not valid)
      var placeI = null ; var placeJ = null; var saturation = 1; var zIndex = 2147483646;

      var idx = this.convertToMap(this.state.x, this.state.y);
      var i = Math.floor(idx[0]);
      var j = Math.floor(idx[1]);

      // precision calculation
      let topFactor = this.getTopFactor(i, j, this.state.x, this.state.y);

      if(tiles[i][j] !== 0) {  // borders of board
        if(topFactor >= 1 && topFactor <= 3) { // is within acceptable distance of border and has neighbour
          idx = this.convertToMap(this.state.x, this.state.y, false); // gets position 
          i = Math.floor(idx[0]);
          j = Math.floor(idx[1]);
          const oldI = i; const oldJ = j; // stores preprojection pos with limit at 0

          if(1/i === -Infinity) i--; // correction to project with i < 0
          if(1/j === -Infinity) j--; // correction to project with j < 0

          if(!this.isAtCorner(i, j)) {
            top=(i+j)*(config.TILESIZE*this.state.camera.zoom/4) + this.state.camera.y
            left=(j-i)*(config.TILESIZE*this.state.camera.zoom/2) + this.state.camera.x
            opacity = 1;
            placeI = oldI; placeJ = oldJ; // updates placement indexes with a valid placement position
            saturation = 64; zIndex = i+j+2;
          }
        }
      } else { // empty slot is a valid position if there is a neighbour tile
        const hasNeighbour = this.hasNeighbour(i, j);

        // if is within the projected top plane of cube to be placed and has a neighbour
        if(topFactor > 0 && topFactor <= 1 && hasNeighbour) {
          //console.log("Im a valid poisition to place block");
          top=(i+j)*(config.TILESIZE*this.state.camera.zoom/4) + this.state.camera.y
          left=(j-i)*(config.TILESIZE*this.state.camera.zoom/2) + this.state.camera.x
          opacity = 1;
          placeI = i; placeJ = j; // updates placement indexes with a valid placement position
          saturation = 64; zIndex = i+j+2;
        }
      }

      // updates placement position with null in case of invalid position
      // or with the indexes of a valid position
      this.placeI = placeI; this.placeJ = placeJ;

      return ( 
        <Tile 
          value={this.state.selectedTile} 
          camera = {this.state.camera}
          opacity = {opacity}
          zIndex = {zIndex}
          saturation = {saturation}
          top={top}
          left={left}
        />
      );
    }

    /**
     * Return if a tile in a given position (i,j) has a valid neighbour (value != 0)
     * @param {*} i the i-index of the tile to check neighbours
     * @param {*} j the j-index of the tile to check neighbours
     */
    hasNeighbour(i, j) {
      const tiles = this.state.tiles.slice();
      const left = j-1 >= 0 ? (tiles[i][j-1] !== 0 ? true : false) : false;
      const right = j+1 < tiles[i].length ? (tiles[i][j+1] !== 0 ? true : false) : false;
      const up = i-1 >= 0 ? (tiles[i-1][j] !== 0 ? true : false) : false;
      const down = i+1 < tiles.length ? (tiles[i+1][j] !== 0 ? true : false) : false;
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
     * changes related to the building mode
     */
    toggleBuild() {
      this.state.isBuilding ? this.setState({isBuilding:false}) : this.setState({isBuilding:true});
    }
  
    // change zoom based on mwheel
    onWheel (e) {
      let scroll = -e.deltaY/3200;
  
      if((this.state.camera.zoom + scroll) > 0 && (this.state.camera.zoom + scroll) <= this.state.camera.max_zoom) {
        const camera = Object.assign({}, this.state.camera); 
        camera.zoom += scroll;
        this.setState({camera:camera});
      }
    }

    render() {
      // let ty =(0+0)*(config.TILESIZE*this.state.camera.zoom/4) + this.state.camera.y - (1*config.TILESIZE*this.state.camera.zoom/2);
      // let cy = this.state.y - this.state.camera.y - this.viewport.offset_y + (1*config.TILESIZE*this.state.camera.zoom/2);

      //  var test_top = this.state.y - this.viewport.offset_y;
      //  var test_left = this.state.camera.x;
  
      return (
        <div className="game-board" 
            style={{ backgroundImage: `url(${background})`,   
                    backgroundSize: 'cover',
                    backgroundRepeat: 'no-repeat',
                  }}
            onMouseDown={ this.handleMouseClick } 
            onMouseUp={ this.handleMouseClick } 
            onMouseMove={this.onMouseMove.bind(this)}
            onWheel = {this.onWheel.bind(this)}
            ref={el => {
                if (!el) return;
                //const camera = Object.assign({}, this.state.camera); 
                this.viewport.offset_x = el.getBoundingClientRect().left;
                this.viewport.offset_y = el.getBoundingClientRect().top;
                this.viewport.width = el.getBoundingClientRect().right - el.getBoundingClientRect().left;
                this.viewport.height = el.getBoundingClientRect().bottom - el.getBoundingClientRect().top;
              }}
        >
          <div
            onClick={() => this.handleClick(this.state.x, this.state.y)}>
              {this.renderTilemap()}  
              {this.state.isBuilding ? this.renderProjection() : null}
              {/* { <Tile 
                value={1} 
                //onClick={() => this.handleClick(i, j)}
                camera = {this.state.camera}
                zIndex = {i+j+2}
                top={test_top}
                left={test_left}
              /> } */}
          </div>
          <button className = "rotate-button" onClick={()=>this.rotate("anticlockwise")}>Anti-clockwise</button>
          <button className = "rotate-button" onClick={()=>this.rotate("clockwise")}>Clockwise</button>
          <button className = "center-button" onClick={()=>this.center()}>Center</button>
          <button className = "building-button" onClick={()=>this.toggleBuild()}>{this.state.isBuilding ? "Cancel" : "Add Block"}</button>
        </div>
      );
    }

    /**
     * Force update on window resize
     */
    resize = () => {
      let dW = Math.abs(this.viewport.rfWidth -  (window.innerWidth*0.70)); 
      let dH = Math.abs(this.viewport.rfHeight -  (window.innerHeight*0.95)); 
      let tZ = config.TILESIZE * this.state.camera.zoom;
      if(dW >= tZ/8 || dH >= tZ/8) {
        this.forceUpdate()
        this.setState({delta: dW+dH})
      }
    }

    componentDidMount() {
      window.addEventListener('resize', this.resize);
      this.forceUpdate()
    }
    
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
function createAndFill2DArray({rows, columns, defaultValue}){
    return Array.from({ length:rows }, (e, i) => (
    Array.from({ length:columns }, (e, j)=> i+j+1)));
}