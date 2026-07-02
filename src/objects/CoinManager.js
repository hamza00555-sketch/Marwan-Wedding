import {
  GAME_WIDTH, GROUND_Y,
  COIN_SPAWN_MIN_MS, COIN_SPAWN_MAX_MS,
  BIG_COIN_VALUE, MAGNET_RADIUS, DEPTH
} from '../constants.js';

// Y offsets above GROUND_Y for different coin heights
const HEIGHTS = [-60, -170, -290, -400];

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
    const roll = Phaser.Math.Between(0, 9);

    if (roll < 1) {
      // rare big dowry coin — worth 5
      this._placeCoin(GAME_WIDTH + 60,
        GROUND_Y + Phaser.Utils.Array.GetRandom(HEIGHTS), true);
    } else if (roll < 4) {
      // single coin at a random height
      this._placeCoin(GAME_WIDTH + 60,
        GROUND_Y + Phaser.Utils.Array.GetRandom(HEIGHTS));
    } else if (roll < 6) {
      // arc of 3 coins at ascending heights
      [-90, -210, -330].forEach((yOff, i) => {
        this.scene.time.delayedCall(i * 90, () => {
          if (this.active) this._placeCoin(GAME_WIDTH + 60, GROUND_Y + yOff);
        });
      });
    } else if (roll < 8) {
      // straight row of 5 at one height
      const y = GROUND_Y + Phaser.Utils.Array.GetRandom(HEIGHTS.slice(0, 3));
      for (let i = 0; i < 5; i++) {
        this._placeCoin(GAME_WIDTH + 60 + i * 64, y);
      }
    } else {
      // zig-zag of 6 — rewards double-jump rhythm
      for (let i = 0; i < 6; i++) {
        const y = GROUND_Y + (i % 2 === 0 ? -100 : -300);
        this._placeCoin(GAME_WIDTH + 60 + i * 88, y);
      }
    }
  }

  /** Burst helper used by the coin-bag power-up: a shower of coins. */
  burst(x, y, n = 8) {
    for (let i = 0; i < n; i++) {
      const a = Math.PI * (0.15 + 0.7 * (i / (n - 1)));
      const cx = x + Math.cos(a) * Phaser.Math.Between(90, 220);
      const cy = y - Math.sin(a) * Phaser.Math.Between(60, 200);
      const coin = this._placeCoin(cx, Math.min(cy, GROUND_Y - 40));
      const targetScale = coin.scaleX;   // scale set by setDisplaySize
      coin.setScale(0).setAlpha(0);
      this.scene.tweens.add({
        targets: coin, scale: targetScale, alpha: 1,
        duration: 260, delay: i * 40, ease: 'Back.easeOut'
      });
    }
  }

  _placeCoin(x, y, big = false) {
    const coin = this.group.create(x, y, big ? 'coin-big' : 'coin');
    const size = big ? 58 : 40;
    coin.setDisplaySize(size, size);
    coin.setDepth(DEPTH.WORLD);
    coin.body.allowGravity = false;
    coin.setImmovable(true);
    coin.body.setSize(size - 6, size - 6);
    coin.isBig  = big;
    coin.value  = big ? BIG_COIN_VALUE : 1;
    if (big) {
      this.scene.tweens.add({
        targets: coin, scale: coin.scale * 1.15,
        duration: 380, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });
    } else {
      coin.play('coin-spin');
    }
    return coin;
  }

  update(speed, delta, magnetTarget = null) {
    const dx = speed * delta / 1000;
    for (const coin of [...this.group.getChildren()]) {
      coin.x -= dx;

      // magnet pull
      if (magnetTarget) {
        const d = Phaser.Math.Distance.Between(coin.x, coin.y, magnetTarget.x, magnetTarget.y);
        if (d < MAGNET_RADIUS) {
          const pull = 620 * delta / 1000 * (1.4 - d / MAGNET_RADIUS);
          const ang  = Math.atan2(magnetTarget.y - coin.y, magnetTarget.x - coin.x);
          coin.x += Math.cos(ang) * pull;
          coin.y += Math.sin(ang) * pull;
        }
      }

      if (coin.x < -80) coin.destroy();
    }
  }

  addOverlap(player, callback) {
    this.scene.physics.add.overlap(player, this.group, callback, null, this.scene);
  }

  clear() { this.group.clear(true, true); }
}
