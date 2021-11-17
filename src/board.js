import React from 'react';
import config from './config.json'
import tile0 from './assets/0.png';
import tile1 from './assets/1.png';
import tile2 from './assets/2.png';
import background from './assets/backgrounds/bg_world.gif';
import * as Vec2D from 'vector2d';

/**
 * Renders a tile in the map
 * @param {props - properties to render the desired tile} props 
 * @returns 
 */
function Tile(props) {
    var tileSprite = tile0;
    if (props.value % 2 === 0)
        tileSprite = tile1;
    else if (props.value % 3 === 0)
        tileSprite = tile2;
    //var rotatedVec = rotateVec2D(props.center.x, props.center.y, 90, new Vec2D.Vector(props.left, props.top))
    return (
        <img src={tileSprite} 
        alt="iso tile" 
        width={config.TILESIZE*props.camera.zoom}
        height={config.TILESIZE*props.camera.zoom}
        //onClick={props.onClick} 
        style={{
        position: 'absolute', 
        top: props.top, 
        left: props.left}}
        />
    );
}

/**
 * The camera of the board
 */
class Camera {
    x = config.INIT_X;  // current x position of the camera
    y = config.INIT_Y; // current y position of the camera
    offset_x = 0; // the x offset of the board in the page
    offset_y = 0; // the y offset of the board in the page
    speed = 1; // camera speed
    zoom = 0.5; // current zoom of the camera to the board
    width = 4; // camera width in tiles
    height = 4; // camera height in tiles
    max_zoom = 4; // camera max zoom
    angle = 0; // current camera angle (from 0 to 3 (0, 90, 180 and 270 degrees))
}

class Board extends React.Component {
    constructor(props) {
      super(props);   
      // sets game world background

      this.camera = new Camera();
      // centers camera
      let center = this.getBoardCenter()
      this.camera.x += center.x - (config.BOARD_WIDTH*config.TILESIZE*this.camera.zoom)
      this.camera.y += center.y - (config.BOARD_HEIGHT*config.TILESIZE*this.camera.zoom)/2
      this.state = {     
        tiles: createAndFill2DArray({rows:config.BOARD_HEIGHT, columns:config.BOARD_WIDTH, defaultValue: '0'}),
        tilesInv: null,
        tilesNormal: createAndFill2DArray({rows:config.BOARD_HEIGHT, columns:config.BOARD_WIDTH, defaultValue: '0'}),
        x: 0,
        y: 0,
        isMouseDown: false,
        isDragging: false,
        lastX: 0,
        lastY: 0,
        lastDragX: 0,
        lastDragY: 0
      };
      // builds inverted tilemap for camera rotations
      //this.state.tilesInv = transpose(this.state.tilesNormal);
      //this.state.tiles = transpose(this.state.tilesInv);
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
             this.setState({ isMouseDown: false, dragAmount: 0});
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
        if(e.nativeEvent.which === 3) {
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
      this.camera.x += offset.x
      this.camera.y += offset.y 
    }
  
    /**
     * Rotates board in the desired direction orientation
     */
    rotate(direction) {
      const matrix = this.state.tiles.slice();
      console.log(matrix);
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
       this.setState({tiles: grid});
       // updates camera to reflect correct position of rotated grid
       this.rotateCamera(direction);
    }
  
    /**
     * adjusts camera to match current board rotation
     */
    rotateCamera(direction) {
      // updates angle
      if(direction === "clockwise") {
        this.camera.angle = (this.camera.angle + 1) % 4;
      } else {
        this.camera.angle--;
        if(this.camera.angle < 0)
          this.camera.angle = 3;
      }
  
      // adjusts camera x based on current angle of choice
      if(this.camera.angle === 1) {
        this.camera.x -= (this.state.tiles.length*config.TILESIZE*this.camera.zoom/4);
      } else if (this.camera.angle === 2) {
        this.camera.x += (this.state.tiles.length*config.TILESIZE*this.camera.zoom)/2;
      } else if (this.camera.angle === 3) {
        this.camera.x -= (this.state.tiles.length*config.TILESIZE*this.camera.zoom/4);
      } else {
        this.camera.x += (this.state.tiles.length*config.TILESIZE*this.camera.zoom)/2;
      }
    }
  
    /**
     * Handles click interactions in the board tiles
     * @param {the x coord of the click to be handled} x 
     * @param {the y coord of the click to be handled} y 
     */
    handleClick(x, y) {
      if(!this.state.isDragging) {
        const tiles = this.state.tiles.slice();
        var idx = this.convertToMap(this.state.x, this.state.y);
        var i = Math.floor(idx[0]);
        var j = Math.floor(idx[1]);
        tiles[i][j] = tiles[i][j] >= '1' ? '1' : '0';
        this.setState({tiles: tiles});
      }
    }
  
    /**
     * Converts coordinates in the screen space (X,Y) of the page
     * to the map coordinates (i,j) that represents the strucutre of tiles
     * @param {The x coordinate to be converted to map index j} screenX 
     * @param {The y coordinate to be converted to map index i} screenY 
     */
    convertToMap(screenX, screenY) {
      let TILESIZE_Z = config.TILESIZE * this.camera.zoom
      let TILE_HALF = TILESIZE_Z / 2;
  
      screenX = screenX - TILE_HALF - this.camera.x - this.camera.offset_x
      screenY = screenY - this.camera.y - this.camera.offset_y
      let i = Math.trunc((screenY/TILE_HALF) - (screenX/TILESIZE_Z));
      let j = Math.trunc((screenY/TILE_HALF) + (screenX/TILESIZE_Z));
  
      // makes sure we do not pass the map 2darray limits
      if (i < 0) i = 0; if(i>=this.state.tiles.length) i = this.state.tiles.length-1;
      if (j < 0) j = 0; if(j>=this.state.tiles[0].length) j = this.state.tiles[0].length-1;
  
      return [i, j];
    }
  
    /**
     * Renders each row of the board/map by rendering all of its tiles
     * @param {The index for the row to be rendered} i 
     */
    renderRow(i) {
      return (
        [...Array(this.state.tiles[i].length)].map((e, j) => <span key = {j}>{this.renderTile(i, j)}</span>
        )
      )
    }
   
    /**
     * Renders the tile
     * @param {The i-index of the tile} i 
     * @param {The j-index of the tile} j 
     * @returns 
     */
    renderTile(i, j) {
      return (
        <Tile 
          value={this.state.tiles[i][j]} 
          //onClick={() => this.handleClick(i, j)}
          camera = {this.camera}
          center = {this.getBoardCenter()}
          top={(i+j)*(config.TILESIZE*this.camera.zoom/4) + this.camera.y}
          left={(j-i)*(config.TILESIZE*this.camera.zoom/2) + this.camera.x}
        />
      )
      
    }
  
    // change zoom based on mwheel
    onWheel (e) {
      let scroll = -e.deltaY/3200;
  
      if((this.camera.zoom + scroll) > 0 && (this.camera.zoom + scroll) <= this.camera.max_zoom) {
        this.camera.zoom += scroll;
        this.setState({render:true});
      }
    }
  
    /**
     * Returns a Vec2D with the point in the center of the isometric board
     */
    getBoardCenter() {
    return new Vec2D.Vector((config.INIT_X - (config.BOARD_WIDTH*config.TILESIZE*this.camera.zoom/2)/2) 
                                                                    + config.TILESIZE*this.camera.zoom/2, 
                            (config.INIT_Y + (config.BOARD_HEIGHT*config.TILESIZE*this.camera.zoom/4)/2) 
                                                                    + config.TILESIZE*this.camera.zoom/2)
    }
  
    render() {
    //   var test_top = (0+0)*(config.TILESIZE*this.camera.zoom/4) + this.camera.y - config.TILESIZE*this.camera.zoom/2;
    //   var test_left = (0-0)*(config.TILESIZE*this.camera.zoom/2) + this.camera.x;
  
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
                this.camera.offset_x = el.getBoundingClientRect().left;
                this.camera.offset_y = el.getBoundingClientRect().top;
              }}
        >
          <div
            onClick={() => this.handleClick(this.state.x, + this.state.y)}>
              {[...Array(this.state.tiles.length)].map((e, i) => <span key = {i}>{this.renderRow(i)}</span>)}  
              {/* { <Tile 
                value={1} 
                //onClick={() => this.handleClick(i, j)}
                camera = {this.camera}
                center = {this.getBoardCenter()}
                top={test_top}
                left={test_left}
              /> } */}
          </div>
          <button className = "rotate-button" onClick={()=>this.rotate("clockwise")}>Clockwise</button>
          <button className = "rotate-button" onClick={()=>this.rotate("anticlockwise")}>Anti-clockwise</button>
        </div>
      );
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
        Array.from({ length:columns }, (e, j)=> i+j)))
    }


    /**
     * Rotates a 2d vector around a provided 2d point
     * @param {* cx The x of the rotation center point} cx 
     * @param {* cy The y of the rotation center point} cy 
     * @param {* degrees The angle to be rotated in degrees} degrees 
     * @param {* v The Vector 2D to be rotated around the provided center} v 
     * @returns A Vector2D with the result of the rotation 
     */
    function rotateVec2D(cx, cy, degrees, v){
        let angle = (Math.PI/180)*degrees;
        return new Vec2D.Vector(Math.cos(angle) * (v.x - cx) - Math.sin(angle) * (v.y - cy) + cx,
                                Math.sin(angle) * (v.x - cx) + Math.cos(angle) * (v.y - cy) + cy);
    }