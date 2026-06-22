import BootScene     from './scenes/BootScene.js';
import MenuScene     from './scenes/MenuScene.js';
import GameScene     from './scenes/GameScene.js';
import WinScene      from './scenes/WinScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import { GAME_WIDTH, GAME_HEIGHT, GRAVITY } from './constants.js';

const config = {
  type: Phaser.CANVAS,   // Canvas avoids POT texture requirements for TileSprite
  width:  GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#87CEEB',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: GRAVITY },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, MenuScene, GameScene, WinScene, GameOverScene]
};

new Phaser.Game(config);
