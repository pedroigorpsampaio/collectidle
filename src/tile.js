import React from 'react';
import config from './config.json';
import tile0 from './assets/0.png';
import tile1 from './assets/1.png';
import tile2 from './assets/2.png';

/**
 * Pure component tile class responsible for
 * rendering tiles into the game board
 */
export default class Tile extends React.PureComponent {

    render() {
        var tileSprite = tile0;
        var opacity = this.props.opacity === null ? 1 : this.props.opacity;
        var saturation = this.props.saturation === null ? 1 : this.props.saturation;
    
        if(this.props.value === 0)
        return (null);
        if (this.props.value % 2 === 0)
            tileSprite = tile1;
        else if (this.props.value % 3 === 0)
            tileSprite = tile2;
    
        return (
            <img src={tileSprite} 
            alt="iso tile" 
            width={config.TILESIZE*this.props.camera.zoom}
            height={config.TILESIZE*this.props.camera.zoom}
            style={{
            opacity: opacity,
            position: 'absolute', 
            filter: 'saturate('+saturation+')',
            zIndex: this.props.zIndex,
            top: this.props.top, 
            left: this.props.left}}
            />
        );
    }
}