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
    if(props.value === 0)
      return (null);
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
    vp_width = 0; // the viewport width of the game board
    vp_height = 0; // the viewport height of the game board
    speed = 1; // camera speed
    zoom = 0.5; // current zoom of the camera to the board
    width = 4; // camera width in tiles
    height = 4; // camera height in tiles
    max_zoom = 4; // camera max zoom
    angle = 0; // current camera angle (from 0 to 3 (0, 90, 180 and 270 degrees))
}

/**
 * The component for the game board/map
 * responsible for operations related to the tilemap
 */
class Board extends React.Component {
    constructor(props) {
      super(props);   
      // sets game world background

      this.camera = new Camera();
      // centers camera
      let center = this.getBoardCenter()
      this.camera.x = center.x;
      this.camera.y = center.y;
      this.state = {
        layers: this.createLayers(),
        x: 0,
        y: 0,
        isMouseDown: false,
        isDragging: false,
        isPlacing: true,
        selectedTile: 1,
        placeI: 0,
        placeJ: 0,
        placeL: 0,
        lastX: 0,
        lastY: 0,
        lastDragX: 0,
        lastDragY: 0
      };
    }

    /**
     * Creates the world map with layers each containing a 2d array/matrix 
     * that contains data of a layer/floor of the board
     */
    createLayers() {
      var layers = [];
      for(let l = 0; l < config.BOARD_LAYERS; l++) {
        layers[l] = createAndFill2DArray({rows:config.BOARD_HEIGHT, columns:config.BOARD_WIDTH, defaultValue: '0'});
      }
      return layers;
    }
      
    /**
     * Returns a Vec2D with the coordinates to center isometric map
     */
    getBoardCenter() {
      let j = config.BOARD_WIDTH;
      let i = config.BOARD_HEIGHT;
      return new Vec2D.Vector(window.innerWidth*0.70/2 - config.TILESIZE*this.camera.zoom/2 
                                                        - (j-i)*(config.TILESIZE*this.camera.zoom/2)/2, 
                              window.innerHeight*0.95/2 - (i+j)*(config.TILESIZE*this.camera.zoom/4)/2)
    }

    /**
     * Position camera in order to position isometric tilemap 
     * in the center of the screen based on layer 0 (first floor)
     */
    center(floorLayer) {
      let j = floorLayer[0].length;
      let i = floorLayer.length;
      let center = new Vec2D.Vector(window.innerWidth*0.70/2 - config.TILESIZE*this.camera.zoom/2 
                                                        - (j-i)*(config.TILESIZE*this.camera.zoom/2)/2, 
                              window.innerHeight*0.95/2 - (i+j)*(config.TILESIZE*this.camera.zoom/4)/2)
      this.camera.x = center.x;
      this.camera.y = center.y;
      this.setState({redraw: true});
    }

    /**
     * Position center coordinates of the isometric map current position
     * @param {the floorLayer - the layer containing the floor tilemap} floorLayer
     */
    getCenter(floorLayer) {
      let j = floorLayer[0].length;
      let i = floorLayer.length;
      let offX = (j-i)*(config.TILESIZE*this.camera.zoom/2)/2;
      let offY = (i+j)*(config.TILESIZE*this.camera.zoom/4)/2;
      return new Vec2D.Vector(this.camera.x + offX + config.TILESIZE*this.camera.zoom/2, 
                                            this.camera.y + offY);
       
      
      //this.camera.x = center.x;
      //this.camera.y = center.y;
      //this.setState({redraw: true});
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

        // if user is placing a new tile, updates the projection of where it would go on placement
        if(this.state.isPlacing) {
          
        }
      }
    }
  
    /**
     * Updates camera's current position
     * @param {offset to be added to the camera's current position} offset 
     */
    updateCamera(offset) {
      this.camera.x += offset.x;
      this.camera.y += offset.y;    
    }
  
    /**
     * Rotates board in the desired direction orientation
     */
    rotate(direction) {
      const newLayers = this.state.layers.slice();
      const oldCenterX = this.getCenter(newLayers[0]).x;

      for(let l = 0; l < this.state.layers.length; l++) {
        const matrix = this.state.layers[l].slice();
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
        newLayers[l] = grid.slice();
       }

       const xOffset = this.getCenter(newLayers[0]).x - oldCenterX;
       this.camera.x -= xOffset;
       this.setState({layers: newLayers});
       
       // updates camera to reflect correct position of rotated grid
       //this.rotateCamera(direction, newLayers[0]);
       
    }
  
    /**
     * adjusts camera to match current board rotation
     */
    rotateCamera(direction, floorLayer) {
      // updates angle
      if(direction === "clockwise") {
        this.camera.angle = (this.camera.angle + 1) % 4;
      } else {
        this.camera.angle--;
        if(this.camera.angle < 0)
          this.camera.angle = 3;
      }
  

     // this.camera.x+= oldCamX;
     // this.camera.y+= oldCamY;
      //this.camera.x = (oldCamX);
      //this.camera.y = (oldCamY);
      // adjusts camera x based on current angle of choice
      if(this.camera.angle === 1) {
       // this.camera.x -= (this.state.layers[0].length*config.TILESIZE*this.camera.zoom/4);
      } else if (this.camera.angle === 2) {
        //this.camera.x += (this.state.layers[0].length*config.TILESIZE*this.camera.zoom)/2;
      } else if (this.camera.angle === 3) {
        //this.camera.x -= (this.state.layers[0].length*config.TILESIZE*this.camera.zoom/4);
      } else {
        //this.camera.x += (this.state.layers[0].length*config.TILESIZE*this.camera.zoom)/2;
      }
    }
  
    /**
     * Handles click interactions in the board tiles
     * @param {the x coord of the click to be handled} x 
     * @param {the y coord of the click to be handled} y 
     */
    handleClick(x, y) {
      if(!this.state.isDragging) {
        const newLayers = this.state.layers.slice();

        // dont mess with undefined
        if (typeof newLayers == "undefined")
          return;

        // ** scans for hit in the layers starting from the layer at the top
        for(let l = newLayers.length-1; l >= 0; l--) {
          var idx = this.convertToMap(l, this.state.x, this.state.y);
          var i = Math.floor(idx[0]);
          var j = Math.floor(idx[1]);
          
          // dont mess with undefined
          if (typeof newLayers[l] == "undefined") {
            console.log("undef 1");
            continue;
          }
          if (typeof newLayers[l][i] == "undefined")
          {
            console.log ("l: " + l + " / i: " + i);
            console.log("undef 2");
            continue;  
          }
          if (typeof newLayers[l][i][j] == "undefined") {
            console.log("undef 3");
            continue;
          }

          // if it hits some block
          if(newLayers[l][i][j] !== 0) {     
            // breaks loop if there is a tile on top of current one
            if(l+1 < newLayers.length)
              if(newLayers[l+1][i][j] !== 0)
                break;
            
            // check if it hits somewhat the top plane of cube
            let ty =(i+j)*(config.TILESIZE*this.camera.zoom/4) + this.camera.y - (l*config.TILESIZE*this.camera.zoom/2);
            let cy = this.state.y - this.camera.y - this.camera.offset_y + (l*config.TILESIZE*this.camera.zoom/2);
            let offsetY = cy - ty;
            if(offsetY < config.TILESIZE*this.camera.zoom/2) {
              newLayers[l][i][j] = 0; // updates it
            }
            break; // break loop
          }
        }
        // updates layers in game state
        this.setState({layers: newLayers});
      }
    }
  
    /**
     * Converts coordinates in the screen space (X,Y) of the page
     * to the map coordinates (i,j) of a given layer
     * @param {the l - the layer index to do the conversion accordingly}
     * @param {The x - the x coordinate to be converted to map index j of layer} screenX 
     * @param {The y - the y coordinate to be converted to map index i of layer} screenY 
     */
    convertToMap(l, screenX, screenY) {
      let TILESIZE_Z = config.TILESIZE * this.camera.zoom;
      let TILE_HALF = TILESIZE_Z / 2;
  
      screenX = screenX - TILE_HALF - this.camera.x - this.camera.offset_x;
      screenY = screenY - this.camera.y - this.camera.offset_y + (l*config.TILESIZE*this.camera.zoom/2);
      let i = Math.trunc((screenY/TILE_HALF) - (screenX/TILESIZE_Z));
      let j = Math.trunc((screenY/TILE_HALF) + (screenX/TILESIZE_Z));
  
      // makes sure we do not pass the map 2darray limits
      if (i < 0) i = 0; if(i>=this.state.layers[l].length) i = this.state.layers[l].length-1;
      if (j < 0) j = 0; if(j>=this.state.layers[l][0].length) j = this.state.layers[l][0].length-1;
  
      return [i, j];
    }

    /**
     * Renders each layer of the board/map by rendering all of its tiles
     * @param {layer layer - The layer to be rendered} layer 
     * @param {the l - the layer index to be rendered} l
     */
    renderLayer(layer, l) {
      return (
        [...Array(layer.length)].map((e, i) => <span key = {i}>{this.renderRow(layer, l, i)}</span>) 
      )
    }
  
    /**
     * Renders each row of the board/map by rendering all of its tiles
     * @param {the layer - the layer currently being rendered} layer
     * @param {the l - the index of the layer bein rendered} l
     * @param {The index - the index for the row to be rendered} i 
     */
    renderRow(layer, l, i) {
      return (
        [...Array(layer[i].length)].map((e, j) => <span key = {j}>{this.renderTile(layer, l, i, j)}</span>
        )
      )
    }
   
    /**
     * Renders the tile
     * @param {The layer - the layer currently being rendered} layer
     * @param {the l - the index of the layer being rendered} l
     * @param {The i-index of the tile} i 
     * @param {The j-index of the tile} j 
     */
    renderTile(layer, l, i, j) {
      return (
        <Tile 
          value={layer[i][j]} 
          //onClick={() => this.handleClick(i, j)}
          camera = {this.camera}
          center = {this.getBoardCenter()}
          top={(i+j)*(config.TILESIZE*this.camera.zoom/4) + this.camera.y - (l*config.TILESIZE*this.camera.zoom/2)}
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
  
    render() {

      // let center = this.getCenter(this.state.layers[0]);

      // var test_top = center.y;
      // var test_left = center.x;
  
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
                this.camera.vp_width = el.getBoundingClientRect().right - el.getBoundingClientRect().left;
                this.camera.vp_height = el.getBoundingClientRect().bottom - el.getBoundingClientRect().top;
              }}
        >
          <div
            onClick={() => this.handleClick(this.state.x, + this.state.y)}>
              {[...Array(this.state.layers.length)].map((e, l) => <span key = {l}>{this.renderLayer(this.state.layers[l], l)}</span>)}  
              {/* { <Tile 
                value={1} 
                //onClick={() => this.handleClick(i, j)}
                camera = {this.camera}
                center = {this.getBoardCenter()}
                top={test_top}
                left={test_left}
              /> } */}
          </div>
          <button className = "rotate-button" onClick={()=>this.rotate("anticlockwise")}>Anti-clockwise</button>
          <button className = "rotate-button" onClick={()=>this.rotate("clockwise")}>Clockwise</button>
          <button className = "center-button" onClick={()=>this.center(this.state.layers[0])}>Center</button>
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
    // function rotateVec2D(cx, cy, degrees, v){
    //     let angle = (Math.PI/180)*degrees;
    //     return new Vec2D.Vector(Math.cos(angle) * (v.x - cx) - Math.sin(angle) * (v.y - cy) + cx,
    //                             Math.sin(angle) * (v.x - cx) + Math.cos(angle) * (v.y - cy) + cy);
    // }