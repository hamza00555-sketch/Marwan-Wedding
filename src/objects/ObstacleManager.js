import {
  GAME_WIDTH, GROUND_Y,
  OBSTACLE_TYPES, SPAWN_MIN_MS, SPAWN_MAX_MS, DEPTH
} from '../constants.js';

// height, yOffset (negative = above ground), hitbox shrink factor
// (sized to match the 188px-tall character)
const CFG = {
  relative: { w: 90,  h: 112, yOff: 0,    hx: 0.75 },
  bills:    { w: 74,  h: 62,  yOff: -175, hx: 0.80 },  // mid-air, bobs
  gossip:   { w: 100, h: 122, yOff: 0,    hx: 0.72 },
  traffic:  { w: 122, h: 134, yOff: 0,    hx: 0.78 },
  crowd:    { w: 150, h: 112, yOff: 0,    hx: 0.70 },
};

export default class ObstacleManager {
  constructor(scene) {
    this.scene      = scene;
    this.group      = scene.physics.add.group();
    this.timer      = null;
    this.active     = false;
    this.difficulty = 0;   // 0..1, set by the scene as progress grows
  }

  start() {
    this.active = true;
    this._schedule();
  }

  stop() {
    this.active = false;
    if (this.timer) this.timer.remove(false);
  }

  setDifficulty(d) { this.difficulty = Phaser.Math.Clamp(d, 0, 1); }

  _schedule() {
    // spawns get denser as the wedding gets closer
    const squeeze = 1 - 0.38 * this.difficulty;
    const delay = Phaser.Math.Between(SPAWN_MIN_MS * squeeze, SPAWN_MAX_MS * squeeze);
    this.timer = this.scene.time.delayedCall(delay, () => {
      if (!this.active) return;
      this._spawn();
      // late game: sometimes a second obstacle right behind the first
      if (this.difficulty > 0.55 && Math.random() < 0.28) {
        this.scene.time.delayedCall(420, () => { if (this.active) this._spawn(240); });
      }
      this._schedule();
    });
  }

  _spawn(xExtra = 0) {
    const type = Phaser.Utils.Array.GetRandom(OBSTACLE_TYPES);
    const cfg  = CFG[type];

    const x = GAME_WIDTH + 90 + xExtra;
    const y = GROUND_Y - cfg.h / 2 + cfg.yOff;

    const obs = this.group.create(x, y, `obstacle-${type}`);
    obs.setDisplaySize(cfg.w, cfg.h);
    obs.setDepth(DEPTH.WORLD);
    obs.body.allowGravity = false;
    obs.setImmovable(true);
    obs.body.setSize(cfg.w * cfg.hx, cfg.h * 0.88);
    obs.obstacleType = type;
    obs.passedPlayer = false;   // near-miss bookkeeping (GameScene)

    if (type === 'bills') {
      // flying bills bob up and down
      obs.bobBase = y;
      obs.bobT    = Math.random() * Math.PI * 2;
    }
  }

  update(speed, delta) {
    const dx = speed * delta / 1000;
    for (const obs of [...this.group.getChildren()]) {
      obs.x -= dx;
      if (obs.bobBase !== undefined) {
        obs.bobT += delta / 1000 * 2.6;
        obs.y     = obs.bobBase + Math.sin(obs.bobT) * 20;
      }
      if (obs.x < -180) obs.destroy();
    }
  }

  addOverlap(player, callback) {
    this.scene.physics.add.overlap(player, this.group, callback, null, this.scene);
  }

  clear() { this.group.clear(true, true); }
}
