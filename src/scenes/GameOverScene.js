import { GAME_WIDTH, GAME_HEIGHT, MIN_COINS } from '../constants.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() { super({ key: 'GameOverScene' }); }

  init(data) {
    this.finalDistance = data.distance ?? 0;
    this.finalCoins    = data.coins    ?? 0;
  }

  create() {
    this.add.image(0, 0, 'gameover-bg')
      .setOrigin(0, 0)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.52);

    this.add.text(GAME_WIDTH / 2, 170, 'ما وصلت للزواج…', {
      fontSize: '52px', fill: '#ff4444', fontFamily: 'Georgia, Arial',
      stroke: '#000', strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 265, 'المعوقات غلبتك هالمرة!', {
      fontSize: '30px', fill: '#fff', fontFamily: 'Arial',
      stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 355, `المسافة: ${this.finalDistance} م`, {
      fontSize: '24px', fill: '#ccc', fontFamily: 'Arial'
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 400, `المهر المجموع: ${this.finalCoins} / ${MIN_COINS} عملة 🪙`, {
      fontSize: '24px', fill: '#ffd700', fontFamily: 'Arial'
    }).setOrigin(0.5);

    this._addBtn(GAME_WIDTH / 2, 500, 'حاول مجدداً', '#8B0000', '#fff', () =>
      this.scene.start('MenuScene')
    );

    this.cameras.main.fadeIn(600);
  }

  _addBtn(x, y, label, bg, fg, cb) {
    const btn = this.add.text(x, y, label, {
      fontSize: '32px', fill: fg, fontFamily: 'Arial',
      backgroundColor: bg, padding: { x: 26, y: 13 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#cc0000' }));
    btn.on('pointerout',  () => btn.setStyle({ backgroundColor: bg }));
    btn.on('pointerdown', () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.time.delayedCall(420, cb);
    });
  }
}
