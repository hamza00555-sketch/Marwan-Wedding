import { GAME_WIDTH, GAME_HEIGHT } from '../constants.js';
import audio from '../objects/AudioEngine.js';

export default class PauseScene extends Phaser.Scene {
  constructor() { super({ key: 'PauseScene' }); }

  create() {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.55);

    this.add.text(GAME_WIDTH / 2, 240, 'إيقاف مؤقت', {
      fontSize: '54px', fill: '#ffd700', fontFamily: 'Georgia, Arial',
      stroke: '#000', strokeThickness: 5
    }).setOrigin(0.5);

    const btn = this.add.text(GAME_WIDTH / 2, 380, '▶ استمرار', {
      fontSize: '32px', fill: '#1a0000', fontFamily: 'Arial',
      backgroundColor: '#FFD700', padding: { x: 26, y: 13 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerdown', () => this._resume());

    this.add.text(GAME_WIDTH / 2, 470, 'P / ESC للاستمرار  •  M لكتم الصوت', {
      fontSize: '17px', fill: '#ccc', fontFamily: 'Arial'
    }).setOrigin(0.5);

    this.input.keyboard.on('keydown-P',   () => this._resume());
    this.input.keyboard.on('keydown-ESC', () => this._resume());
    this.input.keyboard.on('keydown-M',   () => audio.toggleMuted());
  }

  _resume() {
    audio.click();
    this.scene.resume('GameScene');
    this.scene.stop();
  }
}
