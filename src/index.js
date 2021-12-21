import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import Board from './board.js';
import Config from './config.json';
import * as Load from './load.js';
import {FpsView} from "react-fps";
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import BuyIcon from '@mui/icons-material/ShoppingCart';
import CancelIcon from '@mui/icons-material/Cancel';
import blocksSheet from './assets/blocks/sheet.png';
import blocksData from './assets/blocks/sheet.json';
import List from 'react-virtualized/dist/commonjs/List';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import SpriteSheet from './spritesheet.js';
import Vault from './vault.js'

export const STATE_LOADING = 1;
export const STATE_RUNNING = 2;

class Game extends React.Component {
  
  constructor(props) {
    super(props);
    document.body.style.overflow = 'hidden';
    window.addEventListener("contextmenu", e => e.preventDefault());
    this.state = {
      loadProgress: 0,
      selectedBlock: -1,
      loadText: "Loading game...",
      current: STATE_LOADING,
      data: {
        tiles: null,
        treeSpots: null,
        resources: null,
        vault: null,
      },
      isNewBoard: true
    }
  }
  
  // load game components on mount
  componentDidMount () {
    this.loadBoard();

    this.list = Array(Object.keys(blocksData["frames"]).length).fill().map((val, idx) => {
      return {
        id: idx, 
        name: 'John Doe',
        image: 'http://via.placeholder.com/40',
        text: 'loremIpsum',
      }
    });
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
      // send load new game message
      this.boardWorker.postMessage({'cmd': 'loadNewGame', 'rows': Config.BOARD_SIZE, 'columns': Config.BOARD_SIZE, 'defaultValue': -1});
      this.boardWorker.onmessage = e => {
        if(e.data.cmd === "updateProgress") // update load progress
          this.setState({loadProgress: e.data.progress});
        else if(e.data.cmd === "loadNewComplete"){ // new game loaded
          const tiles = new Int8Array(e.data.tiles); // gets tiles as an int8Array to be converted to a matrix and stored
          let data = Object.assign({}, this.state.data); // stores loaded data and create remaining data for new game
          data.tiles = this.matrixify(tiles, Config.BOARD_SIZE, Config.BOARD_SIZE);
          data.resources = this.matrixify(JSON.parse(e.data.resources), Config.BOARD_SIZE, Config.BOARD_SIZE);
          data.treeSpots = [];
          data.vault = new Vault();
          this.setState({data: data, current:STATE_RUNNING});
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
        content = this.renderGame();  
        break;
      default:
        console.log("Unknown game state: Game state must be one of the defined ones");
        break;
    }
     return content;
  }

  // Renders Game
  renderGame() {
    return (
      <div className="game" >
        <div>
          <Board data={this.state.data} isNewBoard={this.state.isNewBoard} 
                  selectedBlock={this.state.selectedBlock} 
                  blocksSheet={blocksSheet} blocksData={blocksData}/>
        </div>
        <div className="game-info">
          <FpsView width={40} height={10} left={0} top={0}/>
          <div>{/* status */}</div>
          <ol>{/* TODO */}</ol>
        </div>
        <div className="game-ui">
          {this.accordions()}
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

  /**
   *  Block card
   */
  card (index) {
    let sprite = index+'.png';// sprite is named based on index
    let blockName = blocksData["frames"][sprite]["name"];
    let blockDesc = blocksData["frames"][sprite]["desc"];
    let blockPrice = blocksData["frames"][sprite]["price"];
    return (
      <Card sx={{ display: 'flex' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <CardContent sx={{ flex: '1 0 auto' }}>
            <Typography component="div" variant="h6">
              {blockName}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary" component="div" sx={{ maxWidth: '13vw' }}>
              {blockDesc}
            </Typography>
          </CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', pl: 2, pb: 0 }}>
            <Typography variant="subtitle1" color="gold" component="div">
              Price: {blockPrice}
            </Typography>
            <IconButton aria-label="buy" onClick={()=>this.toggleBuild(index)}> 
              {this.renderCardButton()}
            </IconButton>
          </Box>
        </Box>
        {/* <CardMedia
          component="img"
          sx={{mt:'5vh' , ml: '5vw', width: 64, height:64}}
          image={tile1}
          alt="Live from space album cover"
        /> */}
        <div style = {{position:'absolute', marginLeft: '75%', marginTop: '10%'}}>
          <SpriteSheet filename={blocksSheet} data={blocksData} sprite={sprite} scaleX={0.25} scaleY={0.25}/>
        </div>
      </Card>
    );
  }

  // renders card button accordingly to current mode
  renderCardButton() {
    if(!this.isBuilding())
      return (<BuyIcon sx={{ height: 38, width: 38 }}/>)
    else 
      return (<CancelIcon sx={{ height: 38, width: 38 }}/>)
  }

  // toggles build mode by toggling selected block index
  toggleBuild(index) {
    if(this.state.selectedBlock === -1)
      this.setState({selectedBlock: index});
    else
      this.setState({selectedBlock: -1})
  }

  // if is in building mode
  isBuilding() {return this.state.selectedBlock > -1;}

  /**
   * Renders each row of virtualized list
   */
  renderRow({ index, key, style }) {
    return (
      <div key={key} style={style} className="row">
        <div className="content">
          <div>{this.card(index)}</div>
        </div>
      </div>
    );
  }

  //resetBlock = () => {this.setState({selectedBlock: -1})}

  /**
   * The side UI accordion
   */
  accordions() {
  
    // const handleChange = (panel) => (event, isExpanded) => {
    //   let val = (isExpanded ? panel : false);
    //   this.setState({expanded: val});
    // };

    /*
    ref={ (ref) => this.accRef=ref }  onMouseDown={(e) => this.handleMouseClick(e)} 
                                        onMouseMove={(e) => this.onMouseMove(e)}
                                        onMouseUp={(e) => this.handleMouseClick(e)}*/
    return (
      <div className = 'accordion' onMouseDown={(e) => e.preventDefault()}>
        <div className = 'accordion-child'>
          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="panel1bh-content"
              id="panel1bh-header"
              sx={{backgroundColor: '#fbeaab', 'border': '1px solid #61265b', borderRadius : '2px'}}
            >
              <Typography sx={{ width: '33%', flexShrink: 0 }}>
                Blocks
              </Typography>
              {/* <Typography sx={{ color: 'text.secondary' }}>You are currently not an owner</Typography> */}
            </AccordionSummary>
            <AccordionDetails  sx={{backgroundColor: '#fbeaab'}}>
              <div className="list">
                <AutoSizer>
                {({ width, height }) => {
                  return <List
                    width={width}
                    height={height}
                    rowHeight={150}
                    rowRenderer={this.renderRow.bind(this)}
                    rowCount={this.list.length} />
                }}
                </AutoSizer>
              </div>
            </AccordionDetails>
          </Accordion>
          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="panel2bh-content"
              id="panel2bh-header"
            >
              <Typography sx={{ width: '33%', flexShrink: 0 }}>Users</Typography>
              <Typography sx={{ color: 'text.secondary' }}>
                You are currently not an owner
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography>
                Donec placerat, lectus sed mattis semper, neque lectus feugiat lectus,
                varius pulvinar diam eros in elit. Pellentesque convallis laoreet
                laoreet.
              </Typography>
            </AccordionDetails>
          </Accordion>
          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="panel3bh-content"
              id="panel3bh-header"
            >
              <Typography sx={{ width: '33%', flexShrink: 0 }}>
                Advanced settings
              </Typography>
              <Typography sx={{ color: 'text.secondary' }}>
                Filtering has been entirely disabled for whole web server
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography>
                Nunc vitae orci ultricies, auctor nunc in, volutpat nisl. Integer sit
                amet egestas eros, vitae egestas augue. Duis vel est augue.
              </Typography>
            </AccordionDetails>
          </Accordion>
          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="panel4bh-content"
              id="panel4bh-header"
            >
              <Typography sx={{ width: '33%', flexShrink: 0 }}>Personal data</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography>
                Nunc vitae orci ultricies, auctor nunc in, volutpat nisl. Integer sit
                amet egestas eros, vitae egestas augue. Duis vel est augue.
              </Typography>
            </AccordionDetails>
          </Accordion>
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
