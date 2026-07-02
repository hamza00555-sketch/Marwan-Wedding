import { GAME_WIDTH, GAME_HEIGHT, MIN_COINS } from '../constants.js';
import audio from '../objects/AudioEngine.js';

export default class WinScene extends Phaser.Scene {
  constructor() { super({ key: 'WinScene' }); }

  init(data) {
    this.stats = {
      distance:   data.distance   ?? 0,
      coins:      data.coins      ?? 0,
      nearMisses: data.nearMisses ?? 0,
      score:      data.score      ?? 0,
      best:       data.best       ?? 0,
      isRecord:   data.isRecord   ?? false,
    };
  }

  create() {
    this.add.image(0, 0, 'win-bg')
      .setOrigin(0, 0)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.28);

    // Confetti-style particles (simple tween bursts)
    for (let i = 0; i < 26; i++) {
      const x = Phaser.Math.Between(50, GAME_WIDTH - 50);
      const col = Phaser.Utils.Array.GetRandom([0xffd700, 0xff4499, 0x44ddff, 0x88ff44]);
      const dot = this.add.rectangle(x, -20, 10, 10, col).setAlpha(0.9)
        .setAngle(Phaser.Math.Between(0, 90));
      this.tweens.add({
        targets: dot,
        y: GAME_HEIGHT + 20, alpha: 0, angle: dot.angle + 180,
        duration: Phaser.Math.Between(2000, 4000),
        delay: Phaser.Math.Between(0, 1500),
        repeat: -1
      });
    }

    this.add.text(GAME_WIDTH / 2, 105, 'وصلت للزواج! 🎉', {
      fontSize: '58px', fill: '#FFD700', fontFamily: 'Georgia, Arial',
      stroke: '#004400', strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 195, 'ألف مبروك يا مروان!', {
      fontSize: '34px', fill: '#fff', fontFamily: 'Arial',
      stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5);

    // Score card
    const s = this.stats;
    const lines = [
      `النقاط: ${s.score}`,
      `المسافة: ${s.distance} م   •   المهر: ${s.coins} / ${MIN_COINS} 🪙`,
      `مراوغات خطيرة: ${s.nearMisses} ⚡`,
    ];
    this.add.text(GAME_WIDTH / 2, 300, lines.join('\n'), {
      fontSize: '25px', fill: '#ffe066', fontFamily: 'Arial',
      align: 'center', lineSpacing: 12,
      stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5);

    if (s.isRecord) {
      const rec = this.add.text(GAME_WIDTH / 2, 400, '🏆 رقم قياسي جديد!', {
        fontSize: '30px', fill: '#ff88ff', fontFamily: 'Arial',
        stroke: '#440044', strokeThickness: 4
      }).setOrigin(0.5).setScale(0);
      this.tweens.add({ targets: rec, scale: 1, duration: 380, ease: 'Back.easeOut', delay: 350 });
    } else {
      this.add.text(GAME_WIDTH / 2, 400, `أفضل نتيجة: ${s.best}`, {
        fontSize: '22px', fill: '#ccc', fontFamily: 'Arial'
      }).setOrigin(0.5);
    }

    this._addBtn(GAME_WIDTH / 2, 490, 'العب مجدداً', '#FFD700', '#1a0000', () =>
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
      audio.click();
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.time.delayedCall(420, cb);
    });
  }
}
