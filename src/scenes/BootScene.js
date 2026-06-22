import {
  CHAR_FRAME_W, CHAR_FRAME_H,
  RUN_FRAMES, JUMP_FRAMES,
  OBSTACLE_TYPES
} from '../constants.js';

export default class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  preload() {
    const { width: W, height: H } = this.scale;

    // ── loading bar ──────────────────────────────────────────────────────
    this.add.rectangle(W / 2, H / 2 - 60, 420, 40, 0x111111, 0.8);
    const bar = this.add.rectangle(W / 2 - 208, H / 2 - 60, 2, 34, 0xffd700)
      .setOrigin(0, 0.5);
    this.add.text(W / 2, H / 2 + 10, 'جاري التحميل…', {
      fontSize: '22px', fill: '#ffffff', fontFamily: 'Arial'
    }).setOrigin(0.5);

    this.load.on('progress', v => { bar.width = 416 * v; });

    // ── character spritesheets ────────────────────────────────────────────
    this.load.spritesheet('marwan-run',
      'assets/images/marwan-run.png',
      { frameWidth: CHAR_FRAME_W, frameHeight: CHAR_FRAME_H });

    this.load.spritesheet('marwan-jump',
      'assets/images/marwan-jump.png',
      { frameWidth: CHAR_FRAME_W, frameHeight: CHAR_FRAME_H });

    // ── backgrounds ───────────────────────────────────────────────────────
    this.load.image('bg-sky',    'assets/images/bg-sky.png');
    this.load.image('bg-shops',  'assets/images/bg-shops.png');
    this.load.image('bg-street', 'assets/images/bg-street.png');
    this.load.image('bg-front',  'assets/images/bg-front.png');

    // ── obstacles ─────────────────────────────────────────────────────────
    OBSTACLE_TYPES.forEach(t =>
      this.load.image(`obstacle-${t}`, `assets/images/obstacle-${t}.png`)
    );

    // ── UI ────────────────────────────────────────────────────────────────
    this.load.image('heart-full',    'assets/images/heart-full.png');
    this.load.image('heart-empty',   'assets/images/heart-empty.png');
    this.load.image('wedding-icon',  'assets/images/wedding-icon.png');
    this.load.spritesheet('coin', 'assets/images/coin.png',
      { frameWidth: 36, frameHeight: 36 });

    // ── scene backgrounds ─────────────────────────────────────────────────
    this.load.image('menu-bg',     'assets/images/menu-bg.png');
    this.load.image('win-bg',      'assets/images/win-bg.png');
    this.load.image('gameover-bg', 'assets/images/gameover-bg.png');
  }

  create() {
    this._createAnimations();
    this.scene.start('MenuScene');
  }

  _createAnimations() {
    const a = this.anims;

    if (!a.exists('player-run')) {
      a.create({
        key: 'player-run',
        frames: a.generateFrameNumbers('marwan-run', { start: 0, end: RUN_FRAMES - 1 }),
        frameRate: 14,
        repeat: -1
      });
    }

    if (!a.exists('player-jump')) {
      a.create({
        key: 'player-jump',
        frames: a.generateFrameNumbers('marwan-jump', { start: 0, end: JUMP_FRAMES - 1 }),
        frameRate: 22,
        repeat: 0   // play once, hold last frame
      });
    }

    if (!a.exists('coin-spin')) {
      a.create({
        key: 'coin-spin',
        frames: a.generateFrameNumbers('coin', { start: 0, end: 5 }),
        frameRate: 10,
        repeat: -1
      });
    }
  }
}
