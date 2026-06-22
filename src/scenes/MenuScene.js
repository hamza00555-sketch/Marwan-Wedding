import { GAME_WIDTH, GAME_HEIGHT } from '../constants.js';

export default class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MenuScene' }); }

  create() {
    // Background
    this.add.image(0, 0, 'menu-bg')
      .setOrigin(0, 0)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

    // Overlay tint
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.32);

    // Title – animated
    const title = this.add.text(GAME_WIDTH / 2, 80, 'مروان', {
      fontSize: '90px', fill: '#FFD700', fontFamily: 'Georgia, Arial',
      stroke: '#5a1a00', strokeThickness: 7
    }).setOrigin(0.5).setAlpha(0);

    const sub = this.add.text(GAME_WIDTH / 2, 190, 'في طريقه للزواج', {
      fontSize: '38px', fill: '#fff', fontFamily: 'Arial',
      stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: title, alpha: 1, y: 110, duration: 700, ease: 'Back.easeOut' });
    this.tweens.add({ targets: sub,   alpha: 1,          duration: 700, delay: 300 });

    // Player preview sprite
    const preview = this.add.sprite(GAME_WIDTH / 2, 350, 'marwan-run').setScale(1.3);
    if (this.anims.exists('player-run')) preview.play('player-run');

    // Start button
    const btn = this.add.text(GAME_WIDTH / 2, 490, '← ابدأ الركض', {
      fontSize: '34px', fill: '#1a0000', fontFamily: 'Arial',
      backgroundColor: '#FFD700',
      padding: { x: 28, y: 14 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => {
      btn.setStyle({ fill: '#5a0000', backgroundColor: '#ffe44d' });
      this.tweens.add({ targets: btn, scaleX: 1.05, scaleY: 1.05, duration: 100 });
    });
    btn.on('pointerout', () => {
      btn.setStyle({ fill: '#1a0000', backgroundColor: '#FFD700' });
      this.tweens.add({ targets: btn, scaleX: 1, scaleY: 1, duration: 100 });
    });
    btn.on('pointerdown', () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.time.delayedCall(420, () => this.scene.start('GameScene'));
    });

    // Controls hint
    this.add.text(GAME_WIDTH / 2, 590, 'مفتاح المسافة / سهم لأعلى / النقر  للقفز  |  قفز مزدوج متاح!', {
      fontSize: '16px', fill: '#ddd', fontFamily: 'Arial'
    }).setOrigin(0.5);

    // Goal reminder
    this.add.text(GAME_WIDTH / 2, 628, `اجمع 50 عملة مهر وصل لقاعة الأفراح!`, {
      fontSize: '17px', fill: '#ffd700', fontFamily: 'Arial',
      stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5);

    this.cameras.main.fadeIn(500);
  }
}
