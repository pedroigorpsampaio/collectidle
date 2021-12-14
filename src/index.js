import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import Board from './board.js';
import Config from './config.json';
import * as Load from './load.js';
import {FpsView} from "react-fps";

export const STATE_LOADING = 1;
export const STATE_RUNNING = 2;

class Game extends React.Component {
  
  constructor(props) {
    super(props);
    document.body.style.overflow = 'hidden';
    window.addEventListener("contextmenu", e => e.preventDefault());
    this.state = {
      loadProgress: 0,
      loadText: "Loading map...",
      current: STATE_LOADING,
      tiles: null,
      isNewBoard: true
    }
  }
  
  // load game components on mount
  componentDidMount () {
    this.loadBoard();
  }

  // transform an array into a 2d array/matrix
  matrixify (arr, rows, cols) {
    var matrix = [];
    if (rows * cols === arr.length) {
        for(var i = 0; i < arr.length; i+= cols) {
            matrix.push(arr.slice(i, cols + i));
        }
    }

    return matrix;
};
  
  /**
   * Loads game board by creating a worker to do the job
   * while update UI until receiving the finished data
   */
  loadBoard() {
    if (window.Worker) {
      // creates worker
      this.boardWorker = new Worker(Load.getWorkerScript());
      // send load map message
      this.boardWorker.postMessage({'cmd': 'loadMap', 'rows': Config.BOARD_SIZE, 'columns': Config.BOARD_SIZE, 'defaultValue': 0});
      this.boardWorker.onmessage = e => {
        if(e.data.cmd === "updateProgress")
          this.setState({loadProgress: e.data.progress});
        else  if(e.data.cmd === "receiveBoard"){
          const tiles = new Uint8Array(e.data.tiles); // gets board as an Uint8Array to be converted to a matrix and stored
          this.setState({tiles: this.matrixify(tiles, Config.BOARD_SIZE, Config.BOARD_SIZE), current:STATE_RUNNING});
        }
      };

    }


   // while(true) console.log(Load.getProgressBoardLoad());
    //this.setState({current:STATE_RUNNING, tiles:tiles});
  }

  /**
   * Renders the game based on current state
   */
  render() {
    // switch states to get content
    var content = null;

    switch(this.state.current) {
      case STATE_LOADING:
        content = this.renderLoadingScreen();
        break;
      case STATE_RUNNING:
        content = this.renderBoard();  
        break;
      default:
        console.log("Unknown game state: Game state must be one of the defined ones");
        break;
    }
     return content;
  }

  // Renders Board
  renderBoard() {
    return (
      <div className="game" >
        <div>
          <Board tiles={this.state.tiles} isNewBoard={this.state.isNewBoard}/>
        </div>
        <div className="game-info">
          <FpsView width={40} height={10} left={0} top={0}/>
          <div>{/* status */}</div>
          <ol>{/* TODO */}</ol>
        </div>
      </div>
    );
  }

  // Loads game and render loading screen
  renderLoadingScreen() {
    return (
      <div className="game" >
        <div>
          {this.state.loadText} ({this.state.loadProgress})
        </div>
      </div>
    );
  }

}

// ========================================

ReactDOM.render(
  <Game />,
  document.getElementById('root')
);
