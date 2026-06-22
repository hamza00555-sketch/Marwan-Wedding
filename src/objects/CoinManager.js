import {
  GAME_WIDTH, GROUND_Y,
  COIN_SPAWN_MIN_MS, COIN_SPAWN_MAX_MS
} from '../constants.js';

// Y offsets above GROUND_Y for different coin heights
const HEIGHTS = [
  { yOff: -55  },   // easy – reachable while running
  { yOff: -155 },   // requires single jump
  { yOff: -270 },   // requires full jump
  { yOff: -380 },   // requires double jump
];

export default class CoinManager {
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
    const delay = Phaser.Math.Between(COIN_SPAWN_MIN_MS, COIN_SPAWN_MAX_MS);
    this.timer = this.scene.time.delayedCall(delay, () => {
      if (!this.active) return;
      this._spawn();
      this._schedule();
    });
  }

  _spawn() {
    const roll = Phaser.Math.Between(0, 3);

    if (roll < 2) {
      // Single coin at a random height
      const h = Phaser.Utils.Array.GetRandom(HEIGHTS);
      this._placeCoin(GAME_WIDTH + 60, GROUND_Y + h.yOff);
    } else {
      // Arc of 3 coins at ascending heights
      const arc = [-80, -190, -300];
      arc.forEach((yOff, i) => {
        this.scene.time.delayedCall(i * 90, () => {
          if (this.active) this._placeCoin(GAME_WIDTH + 60, GROUND_Y + yOff);
        });
      });
    }
  }

  _placeCoin(x, y) {
    const coin = this.group.create(x, y, 'coin');
    coin.setDisplaySize(36, 36);
    coin.body.allowGravity = false;
    coin.setImmovable(true);
    coin.body.setSize(30, 30);
    coin.play('coin-spin');
  }

  update(speed, delta) {
    const dx = speed * delta / 1000;
    this.group.getChildren().forEach(coin => {
      coin.x -= dx;
      if (coin.x < -80) coin.destroy();
    });
  }

  addOverlap(player, callback) {
    this.scene.physics.add.overlap(player, this.group, callback, null, this.scene);
  }

  clear() { this.group.clear(true, true); }
}
