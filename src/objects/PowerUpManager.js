import {
  GAME_WIDTH, GROUND_Y,
  POWERUP_TYPES, POWERUP_SPAWN_MIN_MS, POWERUP_SPAWN_MAX_MS, DEPTH
} from '../constants.js';

export default class PowerUpManager {
  constructor(scene) {
    this.scene  = scene;
    this.group  = scene.physics.add.group();
    this.timer  = null;
    this.active = false;
  }

  start() {
    this.active = true;
    this._schedule();
  }

  stop() {
    this.active = false;
    if (this.timer) this.timer.remove(false);
  }

  _schedule() {
    const delay = Phaser.Math.Between(POWERUP_SPAWN_MIN_MS, POWERUP_SPAWN_MAX_MS);
    this.timer = this.scene.time.delayedCall(delay, () => {
      if (!this.active) return;
      this._spawn();
      this._schedule();
    });
  }

  _spawn() {
    const type = Phaser.Utils.Array.GetRandom(POWERUP_TYPES);
    const y    = GROUND_Y + Phaser.Math.Between(-340, -130);

    const p = this.group.create(GAME_WIDTH + 70, y, `powerup-${type}`);
    p.setDisplaySize(52, 52);
    p.setDepth(DEPTH.WORLD);
    p.body.allowGravity = false;
    p.setImmovable(true);
    p.body.setSize(50, 50);
    p.powerType = type;

    // glow ring behind the icon
    p.ring = this.scene.add.circle(p.x, p.y, 37)
      .setStrokeStyle(4, 0xffe066, 0.85)
      .setDepth(DEPTH.WORLD - 1);
    this.scene.tweens.add({
      targets: p.ring, scale: 1.25, alpha: 0.3,
      duration: 520, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    // gentle bob
    p.bobBase = y;
    p.bobT    = Math.random() * Math.PI * 2;
  }

  update(speed, delta) {
    const dx = speed * delta / 1000;
    for (const p of [...this.group.getChildren()]) {
      p.x    -= dx;
      p.bobT += delta / 1000 * 2.4;
      p.y     = p.bobBase + Math.sin(p.bobT) * 14;
      if (p.ring) p.ring.setPosition(p.x, p.y);
      if (p.x < -80) this.remove(p);
    }
  }

  remove(p) {
    if (p.ring) p.ring.destroy();
    p.destroy();
  }

  addOverlap(player, callback) {
    this.scene.physics.add.overlap(player, this.group, callback, null, this.scene);
  }

  clear() {
    this.group.getChildren().forEach(p => { if (p.ring) p.ring.destroy(); });
    this.group.clear(true, true);
  }
}
