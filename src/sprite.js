import React from 'react';

const Sprite = ({ filename, x, y, width, height, scaleX, scaleY }) => {
  if (!filename) {
    return null;
  }

  const style = {
    backgroundImage: `url(${filename})`,
    backgroundPosition: `${x * (-1)}px ${y * (-1)}px`,
    backgroundRepeat: 'no-repeat',
    width,
    height,
    transformOrigin: '0% 0%',
    transform: `scale(${scaleX}, ${scaleY})`,
  };

  return <div style={style} />;
};

Sprite.defaultProps = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  scaleX: 1,
  scaleY: 1,
};

export default Sprite;