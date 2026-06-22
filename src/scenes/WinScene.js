import { GAME_WIDTH, GAME_HEIGHT, MIN_COINS } from '../constants.js';

export default class WinScene extends Phaser.Scene {
  constructor() { super({ key: 'WinScene' }); }

  init(data) {
    this.finalDistance = data.distance ?? 0;
    this.finalCoins    = data.coins    ?? 0;
  }

  create() {
    this.add.image(0, 0, 'win-bg')
      .setOrigin(0, 0)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.28);

    // Confetti-style particles (simple tween bursts)
    for (let i = 0; i < 18; i++) {
      const x = Phaser.Math.Between(50, GAME_WIDTH - 50);
      const col = Phaser.Utils.Array.GetRandom([0xffd700, 0xff4499, 0x44ddff, 0x88ff44]);
      const dot = this.add.rectangle(x, -20, 10, 10, col).setAlpha(0.9);
      this.tweens.add({
        targets: dot,
        y: GAME_HEIGHT + 20, alpha: 0,
        duration: Phaser.Math.Between(2000, 4000),
        delay: Phaser.Math.Between(0, 1500),
        repeat: -1
      });
    }

    this.add.text(GAME_WIDTH / 2, 120, 'وصلت للزواج! 🎉', {
      fontSize: '58px', fill: '#FFD700', fontFamily: 'Georgia, Arial',
      stroke: '#004400', strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 215, 'ألف مبروك يا مروان!', {
      fontSize: '34px', fill: '#fff', fontFamily: 'Arial',
      stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 300, `المسافة: ${this.finalDistance} م`, {
      fontSize: '26px', fill: '#fff', fontFamily: 'Arial'
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 345, `المهر المجموع: ${this.finalCoins} / ${MIN_COINS} عملة 🪙`, {
      fontSize: '26px', fill: '#ffd700', fontFamily: 'Arial'
    }).setOrigin(0.5);

    this._addBtn(GAME_WIDTH / 2, 445, 'العب مجدداً', '#FFD700', '#1a0000', () =>
      this.scene.start('MenuScene')
    );

    this.cameras.main.fadeIn(700);
  }

  _addBtn(x, y, label, bg, fg, cb) {
    const btn = this.add.text(x, y, label, {
      fontSize: '32px', fill: fg, fontFamily: 'Arial',
      backgroundColor: bg, padding: { x: 26, y: 13 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setStyle({ fill: '#5a0000' }));
    btn.on('pointerout',  () => btn.setStyle({ fill: fg }));
    btn.on('pointerdown', () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.time.delayedCall(420, cb);
    });
  }
}
