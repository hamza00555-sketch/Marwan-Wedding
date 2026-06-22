import {
  GAME_WIDTH, GROUND_Y,
  OBSTACLE_TYPES, SPAWN_MIN_MS, SPAWN_MAX_MS
} from '../constants.js';

// height, yOffset (negative = above ground), hitbox shrink factor
const CFG = {
  relative: { w: 78,  h: 98,  yOff: 0,    hx: 0.75 },
  bills:    { w: 64,  h: 54,  yOff: -155, hx: 0.80 },  // mid-air
  gossip:   { w: 88,  h: 108, yOff: 0,    hx: 0.72 },
  traffic:  { w: 108, h: 118, yOff: 0,    hx: 0.78 },
  crowd:    { w: 132, h: 98,  yOff: 0,    hx: 0.70 },
};

export default class ObstacleManager {
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
    const delay = Phaser.Math.Between(SPAWN_MIN_MS, SPAWN_MAX_MS);
    this.timer = this.scene.time.delayedCall(delay, () => {
      if (!this.active) return;
      this._spawn();
      this._schedule();
    });
  }

  _spawn() {
    const type = Phaser.Utils.Array.GetRandom(OBSTACLE_TYPES);
    const cfg  = CFG[type];

    const x = GAME_WIDTH + 90;
    const y = GROUND_Y - cfg.h / 2 + cfg.yOff;

    const obs = this.group.create(x, y, `obstacle-${type}`);
    obs.setDisplaySize(cfg.w, cfg.h);
    obs.body.allowGravity = false;
    obs.setImmovable(true);
    obs.body.setSize(cfg.w * cfg.hx, cfg.h * 0.88);
    obs.obstacleType = type;
  }

  update(speed, delta) {
    const dx = speed * delta / 1000;
    this.group.getChildren().forEach(obs => {
      obs.x -= dx;
      if (obs.x < -180) obs.destroy();
    });
  }

  addOverlap(player, callback) {
    this.scene.physics.add.overlap(player, this.group, callback, null, this.scene);
  }

  clear() { this.group.clear(true, true); }
}
