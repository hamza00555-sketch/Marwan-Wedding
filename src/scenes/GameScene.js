import {
  GAME_WIDTH, GAME_HEIGHT, GROUND_Y, PLAYER_X,
  INITIAL_SPEED, MAX_SPEED, SPEED_INCREMENT,
  LIVES_MAX, WIN_DISTANCE, MIN_COINS
} from '../constants.js';
import Player          from '../objects/Player.js';
import ObstacleManager from '../objects/ObstacleManager.js';
import CoinManager     from '../objects/CoinManager.js';

export default class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  // ── lifecycle ─────────────────────────────────────────────────────────────

  create() {
    this.scrollSpeed      = INITIAL_SPEED;
    this.distanceTravelled = 0;
    this.coinsCollected   = 0;
    this.gameActive       = true;
    this._transitioning   = false;
    this._mahWarned       = false;

    this._buildBackground();
    this._buildGround();
    this._buildPlayer();
    this._buildObstacles();
    this._buildCoins();
    this._buildHUD();
    this._setupInput();

    this._tryPlayMusic('music-game', { loop: true, volume: 0.38 });

    this.cameras.main.fadeIn(500);
  }

  update(time, delta) {
    if (!this.gameActive) return;

    // Accelerate world scroll
    this.scrollSpeed = Math.min(
      this.scrollSpeed + SPEED_INCREMENT * delta / 1000,
      MAX_SPEED
    );

    // Scroll parallax layers
    this.bgLayers.forEach(({ sprite, factor }) => {
      sprite.tilePositionX += this.scrollSpeed * factor * delta / 1000;
    });

    // Update distance
    this.distanceTravelled += this.scrollSpeed * delta / 1000;

    // Update world objects
    this.obstacles.update(this.scrollSpeed, delta);
    this.coins.update(this.scrollSpeed, delta);
    this.player.update();

    // Keyboard input
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
        Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.player.jump();
    }

    this._refreshHUD();

    if (this.distanceTravelled >= WIN_DISTANCE) this._checkWin();
  }

  // ── scene construction ────────────────────────────────────────────────────

  _buildBackground() {
    // Layers from farthest (bottom) to nearest (top)
    this.bgLayers = [
      { key: 'bg-sky',    factor: 0.03 },
      { key: 'bg-shops',  factor: 0.22 },
      { key: 'bg-street', factor: 0.42 },
      { key: 'bg-front',  factor: 0.68 },
    ].map(({ key, factor }) => ({
      sprite: this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, key).setOrigin(0, 0),
      factor
    }));
  }

  _buildGround() {
    // Invisible static body the player lands on
    this.groundRect = this.add.rectangle(GAME_WIDTH / 2, GROUND_Y + 30, GAME_WIDTH * 2, 60);
    this.groundRect.setVisible(false);
    this.physics.add.existing(this.groundRect, true); // true = static
  }

  _buildPlayer() {
    this.player = new Player(this, PLAYER_X, GROUND_Y - 80);
    this.physics.add.collider(this.player, this.groundRect);
  }

  _buildObstacles() {
    this.obstacles = new ObstacleManager(this);
    this.obstacles.addOverlap(this.player, this._onHitObstacle.bind(this));
    this.obstacles.start();
  }

  _buildCoins() {
    this.coins = new CoinManager(this);
    this.coins.addOverlap(this.player, this._onCollectCoin.bind(this));
    this.coins.start();
  }

  // ── HUD ───────────────────────────────────────────────────────────────────

  _buildHUD() {
    const D = 10; // depth for HUD elements

    // Hearts
    this.heartIcons = [];
    for (let i = 0; i < LIVES_MAX; i++) {
      this.heartIcons.push(
        this.add.image(22 + i * 46, 20, 'heart-full')
          .setOrigin(0, 0).setScrollFactor(0).setDepth(D).setScale(0.95)
      );
    }

    // Progress bar
    const bx = 380, by = 14, bw = 480, bh = 22;
    this.add.rectangle(bx, by, bw, bh, 0x111111, 0.65)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(D);
    this.progressFill = this.add.rectangle(bx + 2, by + 2, 1, bh - 4, 0xffd700)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(D);
    this.add.image(bx + bw + 10, by + bh / 2, 'wedding-icon')
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(D).setScale(0.85);

    // Coin counter
    this.coinText = this.add.text(GAME_WIDTH - 18, 14,
      `🪙 0 / ${MIN_COINS}`, {
        fontSize: '19px', fill: '#ffd700', fontFamily: 'Arial',
        stroke: '#000', strokeThickness: 3
      }).setOrigin(1, 0).setScrollFactor(0).setDepth(D);

    // Distance
    this.distText = this.add.text(GAME_WIDTH / 2, 14, '0م', {
      fontSize: '17px', fill: '#fff', fontFamily: 'Arial',
      stroke: '#333', strokeThickness: 2
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(D);
  }

  _refreshHUD() {
    // Hearts
    for (let i = 0; i < LIVES_MAX; i++) {
      this.heartIcons[i].setTexture(i < this.player.lives ? 'heart-full' : 'heart-empty');
    }

    // Progress bar
    const pct = Math.min(this.distanceTravelled / WIN_DISTANCE, 1);
    this.progressFill.width = 476 * pct;

    // Texts
    this.coinText.setText(`🪙 ${this.coinsCollected} / ${MIN_COINS}`);
    this.distText.setText(`${Math.floor(this.distanceTravelled / 10)}م`);
  }

  // ── input ─────────────────────────────────────────────────────────────────

  _setupInput() {
    this.cursors  = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.input.on('pointerdown', () => this.player.jump());
  }

  // ── collision callbacks ───────────────────────────────────────────────────

  _onHitObstacle(player, obstacle) {
    if (!this.player.takeDamage()) return;
    obstacle.destroy();

    if (this.player.lives <= 0) {
      this.time.delayedCall(600, () => this._triggerGameOver());
    }
  }

  _onCollectCoin(player, coin) {
    coin.destroy();
    this.coinsCollected++;
    this._tryPlaySound('sfx-coin', { volume: 0.45 });

    // Floating +1 text
    const txt = this.add.text(this.player.x + 20, this.player.y - 50, '+1', {
      fontSize: '20px', fill: '#ffd700', fontFamily: 'Arial',
      stroke: '#000', strokeThickness: 2
    }).setDepth(12);

    this.tweens.add({
      targets: txt, y: txt.y - 55, alpha: 0,
      duration: 650, ease: 'Power1',
      onComplete: () => txt.destroy()
    });
  }

  // ── win / lose ────────────────────────────────────────────────────────────

  _checkWin() {
    if (this._transitioning) return;

    if (this.coinsCollected < MIN_COINS) {
      if (!this._mahWarned) {
        this._mahWarned = true;
        this._showWarning(
          `ما عندك كافي مهر!\n${this.coinsCollected} / ${MIN_COINS} عملة\nكمّل الجمع!`
        );
      }
      return;
    }
    this._triggerWin();
  }

  _showWarning(msg) {
    const warn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, msg, {
      fontSize: '30px', fill: '#ff4400', fontFamily: 'Arial',
      stroke: '#000', strokeThickness: 4, align: 'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(20);

    this.tweens.add({
      targets: warn, alpha: 0,
      duration: 2200, delay: 1400,
      onComplete: () => warn.destroy()
    });
  }

  _triggerWin() {
    if (this._transitioning) return;
    this._transitioning = true;
    this.gameActive = false;
    this.obstacles.stop();
    this.coins.stop();
    if (this.music) this.music.stop();
    this._tryPlaySound('sfx-win');

    this.cameras.main.fadeOut(900, 255, 245, 200);
    this.time.delayedCall(950, () => {
      this.scene.start('WinScene', {
        distance: Math.floor(this.distanceTravelled / 10),
        coins: this.coinsCollected
      });
    });
  }

  _triggerGameOver() {
    if (this._transitioning) return;
    this._transitioning = true;
    this.gameActive = false;
    this.obstacles.stop();
    this.coins.stop();
    if (this.music) this.music.stop();
    this._tryPlaySound('sfx-gameover');

    this.cameras.main.fadeOut(700, 0, 0, 0);
    this.time.delayedCall(760, () => {
      this.scene.start('GameOverScene', {
        distance: Math.floor(this.distanceTravelled / 10),
        coins: this.coinsCollected
      });
    });
  }

  // ── audio helpers (graceful no-op if file not loaded) ─────────────────────

  _tryPlayMusic(key, cfg) {
    if (this.cache.audio.has(key)) {
      this.music = this.sound.add(key, cfg);
      this.music.play();
    }
  }

  _tryPlaySound(key, cfg = {}) {
    if (this.cache.audio.has(key)) this.sound.play(key, cfg);
  }
}
