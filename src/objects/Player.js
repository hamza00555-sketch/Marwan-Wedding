import {
  GROUND_Y,
  JUMP_VELOCITY, JUMP2_VELOCITY,
  LIVES_MAX
} from '../constants.js';
import audio from './AudioEngine.js';

// Where the sprite centre rests so the feet touch GROUND_Y
// (body offset 12 + body height 126 - half display height 75 = 63)
const REST_Y = GROUND_Y - 63;

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
    this.hasShield  = false;
    this._state     = 'run';
    this._wasAir    = false;

    // shield aura that follows the player
    this.aura = scene.add.circle(x, y, 62)
      .setStrokeStyle(5, 0x66aaff, 0.9)
      .setFillStyle(0x66aaff, 0.10)
      .setDepth(this.depth + 1)
      .setVisible(false);

    this.play('player-run');
  }

  // ── jumping ───────────────────────────────────────────────────────────────

  jump() {
    if (this.jumpsLeft <= 0) return false;

    const isSecond = this.jumpsLeft === 1;
    this.body.setVelocityY(isSecond ? JUMP2_VELOCITY : JUMP_VELOCITY);
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

    audio.jump(isSecond);
    return true;
  }

  // ── damage / shield ───────────────────────────────────────────────────────

  setShield(on) {
    this.hasShield = on;
    this.aura.setVisible(on);
    if (on) {
      this.aura.setScale(1.6).setAlpha(0);
      this.scene.tweens.add({ targets: this.aura, scale: 1, alpha: 1, duration: 220 });
    }
  }

  /** Returns 'shield' (absorbed), 'hit' (life lost) or false (i-frames). */
  takeDamage() {
    if (this.invincible) return false;

    if (this.hasShield) {
      this.setShield(false);
      audio.shieldSave();
      this._startIFrames(800, 5);
      return 'shield';
    }

    this.lives--;
    audio.hurt();
    this.scene.cameras.main.shake(220, 0.012);
    this._startIFrames(1600, 9);
    return 'hit';
  }

  _startIFrames(ms, flickers) {
    this.invincible = true;
    this.scene.tweens.add({
      targets: this,
      alpha: 0.15,
      duration: Math.floor(ms / (flickers * 2)),
      yoyo: true,
      repeat: flickers,
      onComplete: () => {
        this.alpha      = 1;
        this.invincible = false;
      }
    });
  }

  // ── per-frame update ──────────────────────────────────────────────────────

  update() {
    // Deterministic ground clamp — the ground is a fixed line, so we pin the
    // player to it ourselves (arcade body-vs-static separation proved flaky).
    let onGround = false;
    if (this.y >= REST_Y && this.body.velocity.y >= 0) {
      this.y = REST_Y;
      this.body.setVelocityY(0);
      onGround = true;
    }
    this.onGround = onGround;

    if (onGround) {
      this.jumpsLeft = 2;
      if (this._state === 'jump') this._setState('run');
      this.setAngle(0);

      if (this._wasAir) {
        // landing: squash + let the scene puff some dust
        this.scene.tweens.add({
          targets: this, scaleX: 1.14, scaleY: 0.88,
          duration: 70, yoyo: true,
          onComplete: () => this.setScale(1)
        });
        this.scene.events.emit('player-land', this.x, this.y + 62);
      }
    } else {
      // lean into the jump / dive
      const tilt = Phaser.Math.Clamp(this.body.velocity.y * 0.028, -13, 17);
      this.setAngle(tilt);
    }
    this._wasAir = !onGround;

    this.aura.setPosition(this.x, this.y);
  }

  // ── private ───────────────────────────────────────────────────────────────

  _setState(state) {
    if (this._state === state) return;
    this._state = state;
    if (state === 'run')  this.play('player-run',  true);
    if (state === 'jump') this.play('player-jump', true);
  }
}
