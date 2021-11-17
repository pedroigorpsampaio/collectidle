import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import Board from './board.js'

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
