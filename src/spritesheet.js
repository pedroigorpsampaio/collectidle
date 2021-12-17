import React from 'react';

import Sprite from './sprite.js';

const SpriteSheet = ({ filename, data, sprite, scaleX, scaleY }) => {
  if (!filename || !data || !sprite) {
    return null;
  }

  const spriteData = data["frames"][sprite]["frame"];

  return <Sprite filename={filename} x={spriteData["x"]} y={spriteData["y"]} width={spriteData["w"]} height={spriteData["h"]}
                            scaleX = {scaleX} scaleY = {scaleY} />;
};

SpriteSheet.defaultProps = {
    scaleX: 1,
    scaleY: 1,
  };

export default SpriteSheet;