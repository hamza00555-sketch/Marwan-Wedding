import {
  GAME_WIDTH, GAME_HEIGHT, GROUND_Y, PLAYER_X,
  INITIAL_SPEED, MAX_SPEED, SPEED_INCREMENT,
  LIVES_MAX, WIN_DISTANCE, MIN_COINS,
  MAGNET_DURATION_MS, COMBO_WINDOW_MS, NEAR_MISS_GAP,
  HIGHSCORE_KEY
} from '../constants.js';
import Player          from '../objects/Player.js';
import ObstacleManager from '../objects/ObstacleManager.js';
import CoinManager     from '../objects/CoinManager.js';
import PowerUpManager  from '../objects/PowerUpManager.js';
import audio           from '../objects/AudioEngine.js';

const MILESTONES = [
  { pct: 0.25, msg: 'ربع الطريق! 💪' },
  { pct: 0.50, msg: 'نص الطريق للقاعة! 🕺' },
  { pct: 0.75, msg: 'شوي وتوصل! 🎊' },
];

export default class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  // ── lifecycle ─────────────────────────────────────────────────────────────

  create() {
    this.scrollSpeed       = INITIAL_SPEED;
    this.distanceTravelled = 0;
    this.coinsCollected    = 0;
    this.nearMisses        = 0;
    this.comboChain        = 0;
    this.lastCoinAt        = -99999;
    this.magnetUntil       = 0;
    this.gameActive        = true;
    this._transitioning    = false;
    this._mahWarned        = false;
    this._milestonesHit    = new Set();
    this._speedLines       = [];
    this._lineAccum        = 0;

    this._buildBackground();
    this._buildPlayer();
    this._buildObstacles();
    this._buildCoins();
    this._buildPowerUps();
    this._buildParticles();
    this._buildHUD();
    this._setupInput();

    // dust puff on landing
    this.events.on('player-land', (x, y) => {
      this.dustFx.emitParticleAt(x, y, 6);
    });

    // mute may have been toggled from the pause overlay
    this.events.on('resume', () => {
      this.muteBtn.setText(audio.muted ? '🔇' : '🔊');
    });

    audio.startMusic('game');
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

    // Update distance & difficulty
    this.distanceTravelled += this.scrollSpeed * delta / 1000;
    const pct = Math.min(this.distanceTravelled / WIN_DISTANCE, 1);
    this.obstacles.setDifficulty(pct);

    // Update world objects
    const magnetOn = time < this.magnetUntil;
    this.obstacles.update(this.scrollSpeed, delta);
    this.coins.update(this.scrollSpeed, delta, magnetOn ? this.player : null);
    this.powerups.update(this.scrollSpeed, delta);
    this.player.update();

    this._checkNearMisses();

    // combo chain expires
    if (this.comboChain > 0 && time - this.lastCoinAt > COMBO_WINDOW_MS) {
      this.comboChain = 0;
      this.comboText.setAlpha(0);
    }

    // Keyboard input
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
        Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.player.jump();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyPause) ||
        Phaser.Input.Keyboard.JustDown(this.keyEsc)) {
      this._pause();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyMute)) this._toggleMute();

    this._updateSpeedLines(delta);
    this._updateAtmosphere(pct);
    this._checkMilestones(pct);
    this._refreshHUD(time, magnetOn);

    if (this.distanceTravelled >= WIN_DISTANCE) this._checkWin();
  }

  // ── scene construction ────────────────────────────────────────────────────

  _buildBackground() {
    this.bgLayers = [
      { key: 'bg-sky',    factor: 0.03 },
      { key: 'bg-shops',  factor: 0.22 },
      { key: 'bg-street', factor: 0.42 },
      { key: 'bg-front',  factor: 0.68 },
    ].map(({ key, factor }) => ({
      sprite: this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, key).setOrigin(0, 0),
      factor
    }));

    // warm sunset wash that deepens as the wedding gets closer
    this.sunset = this.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xff7733, 0
    ).setDepth(7);
  }

  _buildPlayer() {
    // Ground contact is handled by the player itself (deterministic clamp)
    this.player = new Player(this, PLAYER_X, GROUND_Y - 80);
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

  _buildPowerUps() {
    this.powerups = new PowerUpManager(this);
    this.powerups.addOverlap(this.player, this._onPowerUp.bind(this));
    this.powerups.start();
  }

  _buildParticles() {
    this.coinFx = this.add.particles(0, 0, 'p-star', {
      speed: { min: 70, max: 190 }, scale: { start: 0.9, end: 0 },
      lifespan: 420, gravityY: 320, tint: 0xffd700, emitting: false
    }).setDepth(9);

    this.dustFx = this.add.particles(0, 0, 'p-dot', {
      speed: { min: 30, max: 90 }, angle: { min: 200, max: 340 },
      scale: { start: 0.8, end: 0 }, lifespan: 380,
      tint: 0xcbb9a0, emitting: false
    }).setDepth(9);

    this.hitFx = this.add.particles(0, 0, 'p-dot', {
      speed: { min: 130, max: 280 }, scale: { start: 1, end: 0 },
      lifespan: 460, gravityY: 520, tint: 0xff5544, emitting: false
    }).setDepth(9);

    this.shieldFx = this.add.particles(0, 0, 'p-star', {
      speed: { min: 90, max: 220 }, scale: { start: 0.9, end: 0 },
      lifespan: 420, tint: 0x66aaff, emitting: false
    }).setDepth(9);
  }

  // ── HUD ───────────────────────────────────────────────────────────────────

  _buildHUD() {
    const D = 10;

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

    // Combo indicator (hidden until a chain builds)
    this.comboText = this.add.text(GAME_WIDTH / 2, 52, '', {
      fontSize: '24px', fill: '#ffec80', fontFamily: 'Arial',
      stroke: '#7a4a00', strokeThickness: 4
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(D).setAlpha(0);

    // Active magnet indicator
    this.magnetIcon = this.add.image(GAME_WIDTH - 40, 96, 'powerup-magnet')
      .setScrollFactor(0).setDepth(D).setScale(0.6).setVisible(false);
    this.magnetBar = this.add.rectangle(GAME_WIDTH - 64, 96, 4, 10, 0xffe066)
      .setOrigin(1, 0.5).setScrollFactor(0).setDepth(D).setVisible(false);

    // Mute / pause buttons
    this.muteBtn = this._hudButton(GAME_WIDTH - 18, 44, audio.muted ? '🔇' : '🔊',
      () => this._toggleMute());
    this._hudButton(GAME_WIDTH - 64, 44, '⏸', () => this._pause());
  }

  _hudButton(x, y, label, cb) {
    const btn = this.add.text(x, y, label, {
      fontSize: '22px', backgroundColor: '#00000055', padding: { x: 8, y: 4 }
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(11)
      .setInteractive({ useHandCursor: true });
    btn.on('pointerdown', (pointer, lx, ly, event) => {
      event.stopPropagation();
      cb();
    });
    return btn;
  }

  _toggleMute() {
    const muted = audio.toggleMuted();
    this.muteBtn.setText(muted ? '🔇' : '🔊');
  }

  _pause() {
    if (!this.gameActive) return;
    this.scene.launch('PauseScene');
    this.scene.pause();
  }

  _refreshHUD(time, magnetOn) {
    for (let i = 0; i < LIVES_MAX; i++) {
      this.heartIcons[i].setTexture(i < this.player.lives ? 'heart-full' : 'heart-empty');
    }

    const pct = Math.min(this.distanceTravelled / WIN_DISTANCE, 1);
    this.progressFill.width = 476 * pct;

    this.coinText.setText(`🪙 ${this.coinsCollected} / ${MIN_COINS}`);
    this.distText.setText(`${Math.floor(this.distanceTravelled / 10)}م`);

    this.magnetIcon.setVisible(magnetOn);
    this.magnetBar.setVisible(magnetOn);
    if (magnetOn) {
      const left = (this.magnetUntil - time) / MAGNET_DURATION_MS;
      this.magnetBar.width = 70 * Phaser.Math.Clamp(left, 0, 1);
    }
  }

  // ── input ─────────────────────────────────────────────────────────────────

  _setupInput() {
    this.cursors  = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyPause = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this.keyEsc   = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.keyMute  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    this.input.on('pointerdown', () => this.player.jump());
  }

  // ── near-miss detection ───────────────────────────────────────────────────

  _checkNearMisses() {
    const pb = this.player.body;
    for (const obs of this.obstacles.group.getChildren()) {
      if (obs.passedPlayer || !obs.body) continue;
      if (obs.body.right < pb.left) {
        obs.passedPlayer = true;
        const gapAbove = pb.top - obs.body.bottom;   // player above obstacle
        const gapBelow = obs.body.top - pb.bottom;   // player below (under bills)
        const gap = Math.max(gapAbove, gapBelow);
        if (gap > 0 && gap < NEAR_MISS_GAP && !this.player.invincible) {
          this._onNearMiss();
        }
      }
    }
  }

  _onNearMiss() {
    this.nearMisses++;
    audio.nearMiss();
    const txt = this.add.text(this.player.x + 40, this.player.y - 90, 'مرّت بجنبك! ⚡', {
      fontSize: '19px', fill: '#aaddff', fontFamily: 'Arial',
      stroke: '#003355', strokeThickness: 3
    }).setOrigin(0.5).setDepth(12);
    this.tweens.add({
      targets: txt, y: txt.y - 45, alpha: 0, duration: 700,
      onComplete: () => txt.destroy()
    });
  }

  // ── collision callbacks ───────────────────────────────────────────────────

  _onHitObstacle(player, obstacle) {
    const result = this.player.takeDamage();
    if (!result) return;

    obstacle.destroy();

    if (result === 'shield') {
      this.shieldFx.emitParticleAt(this.player.x, this.player.y, 14);
      this._floatText(this.player.x, this.player.y - 90, 'الدرع حماك! 🛡️', '#aaddff');
      return;
    }

    // real hit: brief hit-stop + red flash + combo broken
    this.hitFx.emitParticleAt(this.player.x + 20, this.player.y, 12);
    this.comboChain = 0;
    this.comboText.setAlpha(0);
    this.cameras.main.flash(120, 255, 60, 40);
    this.physics.world.pause();
    this.time.delayedCall(85, () => {
      if (!this._transitioning) this.physics.world.resume();
    });

    if (this.player.lives <= 0) {
      this.time.delayedCall(600, () => this._triggerGameOver());
    }
  }

  _onCollectCoin(player, coin) {
    const now = this.time.now;
    this.comboChain = (now - this.lastCoinAt < COMBO_WINDOW_MS) ? this.comboChain + 1 : 1;
    this.lastCoinAt = now;

    // long chains turn ordinary coins into double dowry
    let value = coin.value;
    if (!coin.isBig && this.comboChain >= 5) value = 2;
    this.coinsCollected += value;

    this.coinFx.emitParticleAt(coin.x, coin.y, coin.isBig ? 16 : 7);
    if (coin.isBig) audio.bigCoin(); else audio.coin(this.comboChain);
    coin.destroy();

    this._floatText(this.player.x + 20, this.player.y - 50, `+${value}`,
      coin.isBig ? '#ffec80' : '#ffd700', coin.isBig ? '26px' : '20px');

    if (this.comboChain >= 3) {
      this.comboText.setText(`سلسلة ×${this.comboChain} 🔥`).setAlpha(1);
      this.tweens.add({ targets: this.comboText, scale: { from: 1.25, to: 1 }, duration: 140 });
    }

    // coin counter pop
    this.tweens.add({ targets: this.coinText, scale: { from: 1.2, to: 1 }, duration: 120 });
  }

  _onPowerUp(player, p) {
    const type = p.powerType;
    this.powerups.remove(p);
    audio.powerup();
    this.coinFx.emitParticleAt(this.player.x, this.player.y - 30, 10);

    if (type === 'magnet') {
      this.magnetUntil = this.time.now + MAGNET_DURATION_MS;
      this._floatText(this.player.x, this.player.y - 100, 'مغناطيس المهر! 🧲', '#ff8877');
    } else if (type === 'shield') {
      this.player.setShield(true);
      this._floatText(this.player.x, this.player.y - 100, 'درع الحماية! 🛡️', '#88bbff');
    } else if (type === 'coinbag') {
      this.coins.burst(GAME_WIDTH * 0.62, GROUND_Y - 240, 9);
      this._floatText(this.player.x, this.player.y - 100, 'مطر المهر! 💰', '#ffe066');
    }
  }

  _floatText(x, y, msg, color, size = '20px') {
    const txt = this.add.text(x, y, msg, {
      fontSize: size, fill: color, fontFamily: 'Arial',
      stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(12);
    this.tweens.add({
      targets: txt, y: y - 55, alpha: 0, duration: 750, ease: 'Power1',
      onComplete: () => txt.destroy()
    });
  }

  // ── atmosphere & speed lines ──────────────────────────────────────────────

  _updateAtmosphere(pct) {
    this.sunset.setAlpha(pct * 0.15);
  }

  _updateSpeedLines(delta) {
    if (this.scrollSpeed > 430) {
      this._lineAccum += delta;
      if (this._lineAccum > 90) {
        this._lineAccum = 0;
        const line = this.add.rectangle(
          GAME_WIDTH + 60, Phaser.Math.Between(60, GROUND_Y - 160),
          Phaser.Math.Between(80, 170), 3, 0xffffff, 0.22
        ).setDepth(6);
        this._speedLines.push(line);
      }
    }
    for (let i = this._speedLines.length - 1; i >= 0; i--) {
      const line = this._speedLines[i];
      line.x -= this.scrollSpeed * 1.7 * delta / 1000;
      if (line.x < -120) { line.destroy(); this._speedLines.splice(i, 1); }
    }
  }

  _checkMilestones(pct) {
    for (const m of MILESTONES) {
      if (pct >= m.pct && !this._milestonesHit.has(m.pct)) {
        this._milestonesHit.add(m.pct);
        audio.milestone();
        const banner = this.add.text(GAME_WIDTH / 2, 130, m.msg, {
          fontSize: '34px', fill: '#ffe066', fontFamily: 'Arial',
          stroke: '#5a2a00', strokeThickness: 5
        }).setOrigin(0.5).setScrollFactor(0).setDepth(15).setScale(0);
        this.tweens.add({
          targets: banner, scale: 1, duration: 260, ease: 'Back.easeOut',
          onComplete: () => this.tweens.add({
            targets: banner, alpha: 0, y: 100, duration: 600, delay: 1200,
            onComplete: () => banner.destroy()
          })
        });
      }
    }
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

  _finalStats() {
    const meters = Math.floor(this.distanceTravelled / 10);
    const score  = meters
      + this.coinsCollected * 15
      + this.nearMisses * 40
      + Math.max(this.player.lives, 0) * 120;

    const best = parseInt(localStorage.getItem(HIGHSCORE_KEY) || '0', 10);
    const isRecord = score > best;
    if (isRecord) localStorage.setItem(HIGHSCORE_KEY, String(score));

    return {
      distance: meters,
      coins: this.coinsCollected,
      nearMisses: this.nearMisses,
      lives: Math.max(this.player.lives, 0),
      score, best: Math.max(best, score), isRecord
    };
  }

  _stopWorld() {
    this._transitioning = true;
    this.gameActive = false;
    this.obstacles.stop();
    this.coins.stop();
    this.powerups.stop();
    audio.stopMusic();
  }

  _triggerWin() {
    if (this._transitioning) return;
    this._stopWorld();
    audio.win();

    this.cameras.main.fadeOut(900, 255, 245, 200);
    this.time.delayedCall(950, () => {
      this.scene.start('WinScene', this._finalStats());
    });
  }

  _triggerGameOver() {
    if (this._transitioning) return;
    this._stopWorld();
    audio.gameover();

    this.cameras.main.fadeOut(700, 0, 0, 0);
    this.time.delayedCall(760, () => {
      this.scene.start('GameOverScene', this._finalStats());
    });
  }
}
