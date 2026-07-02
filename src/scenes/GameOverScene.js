import { GAME_WIDTH, GAME_HEIGHT, MIN_COINS } from '../constants.js';
import audio from '../objects/AudioEngine.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() { super({ key: 'GameOverScene' }); }

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
    this.add.image(0, 0, 'gameover-bg')
      .setOrigin(0, 0)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.52);

    this.add.text(GAME_WIDTH / 2, 150, 'ما وصلت للزواج…', {
      fontSize: '52px', fill: '#ff4444', fontFamily: 'Georgia, Arial',
      stroke: '#000', strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 240, 'المعوقات غلبتك هالمرة!', {
      fontSize: '30px', fill: '#fff', fontFamily: 'Arial',
      stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5);

    const s = this.stats;
    const lines = [
      `النقاط: ${s.score}`,
      `المسافة: ${s.distance} م   •   المهر: ${s.coins} / ${MIN_COINS} 🪙`,
      `مراوغات خطيرة: ${s.nearMisses} ⚡`,
    ];
    this.add.text(GAME_WIDTH / 2, 350, lines.join('\n'), {
      fontSize: '24px', fill: '#ddd', fontFamily: 'Arial',
      align: 'center', lineSpacing: 10,
      stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5);

    if (s.isRecord) {
      const rec = this.add.text(GAME_WIDTH / 2, 445, '🏆 رقم قياسي جديد رغم كل شيء!', {
        fontSize: '26px', fill: '#ffd700', fontFamily: 'Arial',
        stroke: '#443300', strokeThickness: 4
      }).setOrigin(0.5).setScale(0);
      this.tweens.add({ targets: rec, scale: 1, duration: 380, ease: 'Back.easeOut', delay: 300 });
    } else if (s.best > 0) {
      this.add.text(GAME_WIDTH / 2, 445, `أفضل نتيجة: ${s.best}`, {
        fontSize: '21px', fill: '#aaa', fontFamily: 'Arial'
      }).setOrigin(0.5);
    }

    this._addBtn(GAME_WIDTH / 2, 530, 'حاول مجدداً', '#8B0000', '#fff', () =>
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
      audio.click();
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.time.delayedCall(420, cb);
    });
  }
}
