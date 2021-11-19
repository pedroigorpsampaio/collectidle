import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import Board from './board.js';
import {FpsView} from "react-fps";

class Game extends React.Component {
  constructor(props) {
    super(props);
    document.body.style.overflow = 'hidden';
    window.addEventListener("contextmenu", e => e.preventDefault());
  }
  
  render() {
    return (
      <div className="game" >
        <div>
          <Board />
        </div>
        <div className="game-info">
          <FpsView width={150} height={90} left={900} top={15}/>
          <div>{/* status */}</div>
          <ol>{/* TODO */}</ol>
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
