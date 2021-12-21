import config from './config.json'

/**
 * Camera class for board camera operations
 */
 export default class Camera {
    x = config.INIT_X;  // current x position of the camera
    y = config.INIT_Y; // current y position of the camera
    speed = 1; // camera speed
    zoom = 1; // current zoom of the camera to the board
    min_zoom = 0.8; // camera height in tiles
    max_zoom = 2; // camera max zoom
    angle = 0; // current camera angle (from 0 to 3 (0, 90, 180 and 270 degrees))
 }
