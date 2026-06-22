import {
  GROUND_Y, CHAR_FRAME_H,
  JUMP_VELOCITY, JUMP2_VELOCITY,
  LIVES_MAX, INVINCIBILITY_MS
} from '../constants.js';

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'marwan-run');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setSize(58, 126);
    this.body.setOffset(27, 12);
    this.body.setMaxVelocityY(900);

    this.jumpsLeft  = 0;
    this.invincible = false;
    this.lives      = LIVES_MAX;
    this._state     = 'run';

    this.play('player-run');
  }

  // ── jumping ───────────────────────────────────────────────────────────────

  jump() {
    if (this.jumpsLeft <= 0) return false;

    const vel = (this.jumpsLeft === 2) ? JUMP_VELOCITY : JUMP2_VELOCITY;
    this.body.setVelocityY(vel);
    this.jumpsLeft--;

    if (this._state !== 'jump') {
      this._setState('jump');
    } else {
      // double-jump squish feedback
      this.scene.tweens.add({
        targets: this, scaleX: 1.25, scaleY: 0.8,
        duration: 80, yoyo: true
      });
    }

    this._trySound('sfx-jump', { volume: 0.55 });
    return true;
  }

  // ── damage ────────────────────────────────────────────────────────────────

  takeDamage() {
    if (this.invincible) return false;

    this.lives--;
    this.invincible = true;
    this._trySound('sfx-hurt', { volume: 0.7 });
    this.scene.cameras.main.shake(220, 0.012);

    this.scene.tweens.add({
      targets: this,
      alpha: 0.15,
      duration: 90,
      yoyo: true,
      repeat: 9,
      onComplete: () => {
        this.alpha      = 1;
        this.invincible = false;
      }
    });
    return true;
  }

  // ── per-frame update ──────────────────────────────────────────────────────

  update() {
    const onGround = this.body.blocked.down;

    if (onGround) {
      this.jumpsLeft = 2;
      if (this._state === 'jump') this._setState('run');
    }
  }

  // ── private ───────────────────────────────────────────────────────────────

  _setState(state) {
    if (this._state === state) return;
    this._state = state;
    if (state === 'run')  this.play('player-run',  true);
    if (state === 'jump') this.play('player-jump', true);
  }

  _trySound(key, cfg = {}) {
    if (this.scene.cache.audio.has(key)) this.scene.sound.play(key, cfg);
  }
}
