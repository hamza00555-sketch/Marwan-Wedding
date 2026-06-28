# CLAUDE.md

Guidance for AI assistants working in this repository.

## Project Overview

**Marwan Wedding Run** (`مروان — في طريقه للزواج`, "Marwan on his way to the wedding")
is a 2D side-scrolling endless-runner browser game built with **Phaser 3**. The
player controls Marwan as he runs toward his wedding hall, jumping over comedic
"obstacles to marriage" (nosy relatives, bills, gossip, traffic, crowds) while
collecting coins that represent the *mahr* (dowry). To win, the player must
reach the goal distance **and** have collected at least 50 coins.

The game UI and all in-game text are in **Arabic** (RTL). The page is set to
`lang="ar" dir="rtl"`.

## Tech Stack & Architecture

- **Engine:** Phaser 3.80.1, loaded from a CDN (`cdn.jsdelivr.net`) — there is
  **no bundler, no package.json, and no node_modules**. The `Phaser` global is
  available at runtime via the `<script>` tag in `index.html`.
- **Modules:** Native ES modules (`<script type="module">`). Source files use
  `import`/`export` and run directly in the browser — no transpilation step.
- **Rendering:** Forced to `Phaser.CANVAS` (not WebGL). This is intentional —
  it avoids power-of-two texture requirements for the parallax `TileSprite`
  background layers. Do not change this without a reason.
- **Physics:** Arcade physics with gravity. The world scrolls past a
  fixed-position player; obstacles/coins move leftward manually (see managers).

### Directory layout

```
index.html              Entry point: loads Phaser CDN + src/game.js
process_assets.py        One-off asset-generation script (see below)
src/
  game.js               Phaser.Game config + scene registration
  constants.js          ALL tunable gameplay values live here
  scenes/
    BootScene.js        Preloads assets, defines animations → starts MenuScene
    MenuScene.js        Title screen + start button + controls hint
    GameScene.js        Core gameplay loop (scroll, HUD, collisions, win/lose)
    WinScene.js         Victory screen (requires reaching distance + 50 coins)
    GameOverScene.js    Failure screen (lives exhausted)
  objects/
    Player.js           Player sprite: jump/double-jump, damage, animation state
    ObstacleManager.js  Spawns + moves + recycles obstacles
    CoinManager.js      Spawns + moves + recycles coins
assets/
  images/               Spritesheets, backgrounds, obstacle/UI art (PNG)
  audio/                Empty (only .gitkeep) — audio is optional, see below
```

### Scene flow

```
BootScene → MenuScene → GameScene → WinScene  (win)
                          ↑     └──→ GameOverScene  (lose)
                          └──────────┘  ("play again" returns to MenuScene)
```

Scenes are registered in order in `src/game.js`. `BootScene` runs first and
hands off to `MenuScene` after assets/animations are ready.

## Key Conventions

- **All gameplay tuning lives in `src/constants.js`.** Speed, gravity, jump
  velocities, lives, win distance, coin requirement, spawn intervals, frame
  counts, and obstacle types are constants there. Change balance/difficulty by
  editing this file — avoid hard-coding magic numbers in scenes/objects.
- **Manager pattern:** `ObstacleManager` and `CoinManager` are plain (non-Phaser)
  classes that own a `physics.add.group()`, self-schedule spawns with
  `time.delayedCall`, and are driven each frame by `GameScene.update()` calling
  their `update(scrollSpeed, delta)`. Both expose `start()`, `stop()`,
  `update()`, `addOverlap(player, cb)`, and `clear()`. Off-screen objects are
  destroyed in `update()`. Follow this shape for any new world-object manager.
- **Player as a class:** `Player` extends `Phaser.Physics.Arcade.Sprite` and
  encapsulates its own state (`jumpsLeft`, `invincible`, `lives`, `_state`
  run/jump). Damage handling, invincibility flicker, and double-jump are all in
  `Player.js`. `GameScene` calls `player.jump()`, `player.takeDamage()`,
  `player.update()`.
- **Audio is optional and defensive.** No audio files are committed. Code uses
  `_tryPlaySound` / `_tryPlayMusic` / `_trySound` helpers that check
  `this.cache.audio.has(key)` first, so missing audio is a silent no-op. If you
  add audio, load it in `BootScene.preload()` with keys like `music-game`,
  `sfx-jump`, `sfx-coin`, `sfx-hurt`, `sfx-win`, `sfx-gameover` (the keys the
  code already references).
- **Manual scrolling, not a camera.** The player is pinned at `PLAYER_X`.
  Parallax backgrounds scroll via `tileSprite.tilePositionX`; obstacles/coins
  translate by `speed * delta / 1000`. HUD elements use `setScrollFactor(0)` and
  a depth of ~10–20.
- **Arabic / RTL text.** UI strings are Arabic literals embedded directly in
  scene code. Preserve RTL and existing wording when editing; numbers in HUD use
  Arabic suffix `م` (meters). Distance shown to the player is
  `distanceTravelled / 10`.
- **Style:** ES module imports at top, named constant imports from
  `constants.js`, section header comments (`// ── ... ──`), private methods
  prefixed with `_`. Match the surrounding 2-space indentation and aligned-import
  style.

## Gameplay Rules (current balance)

- **Win:** travel `WIN_DISTANCE` (26000 px) **and** collect ≥ `MIN_COINS` (50).
  If distance is reached without enough coins, a warning shows and play
  continues until coins are collected.
- **Lose:** lose all `LIVES_MAX` (3) lives. Each hit costs one life and grants
  ~1.6 s invincibility (`INVINCIBILITY_MS`).
- **Movement:** double-jump enabled (`jumpsLeft = 2` on ground). Inputs: Space,
  Up arrow, or pointer/tap.
- **Difficulty ramp:** scroll speed starts at `INITIAL_SPEED` (280) and
  increases `SPEED_INCREMENT` (2.8/s) up to `MAX_SPEED` (540).
- **Obstacles:** types in `OBSTACLE_TYPES`; per-type size/height/hitbox in the
  `CFG` table in `ObstacleManager.js` (e.g. `bills` spawns mid-air).
- **Coins:** spawn at four heights (`HEIGHTS` in `CoinManager.js`); sometimes a
  3-coin ascending arc.

## Assets

- **`process_assets.py`** is a **one-off generation/preprocessing script**, not
  part of the runtime. It reads raw animation frames from `/tmp/assets_preview`
  (no longer present), builds the character spritesheets (`marwan-run.png` 16
  frames, `marwan-jump.png` 25 frames), copies background layers, and draws
  placeholder obstacle/UI/coin art with Pillow + numpy. The committed PNGs in
  `assets/images/` are its output. You normally do **not** need to run it; the
  game loads the committed PNGs directly. Note its `OUT` path and source dirs are
  hard-coded absolute paths.
- Character frames are `112×150` (`CHAR_FRAME_W/H`); coin frames `36×36`. If you
  regenerate spritesheets at different dimensions, update `constants.js` and the
  `frameWidth/frameHeight` in `BootScene.preload()` to match.
- Obstacle art is currently **colored placeholder rectangles** with Arabic
  labels — replacing them with real art is a known improvement.

## Running & Testing

There is no build step and no test suite. The game is a static site.

- **Run locally:** serve the repo root over HTTP (ES modules require it — opening
  `index.html` via `file://` will fail due to module CORS). For example:
  `python3 -m http.server 8000` then open `http://localhost:8000/`.
- **Verify a change:** load the page, watch the browser console for load/runtime
  errors, and play through Menu → Game → Win/GameOver.
- No linter or formatter is configured.

## Git Workflow

- Active development branch for this work: `claude/claude-md-docs-oul0la`.
  Another feature branch exists: `claude/merouan-side-scroller-b4te3m`.
- Commit with clear, descriptive messages. Push with
  `git push -u origin <branch-name>`. Do **not** push to other branches without
  explicit permission, and do **not** open a pull request unless asked.

## Common Tasks — Where to Look

- Change difficulty/balance → `src/constants.js`
- Add/modify an obstacle → `OBSTACLE_TYPES` in `constants.js` + `CFG` in
  `ObstacleManager.js` + an `obstacle-<type>.png` asset (loaded automatically in
  `BootScene` by iterating `OBSTACLE_TYPES`)
- Change coin placement/arcs → `CoinManager.js` (`HEIGHTS`, `_spawn`)
- Player jump/damage feel → `Player.js` + jump/invincibility constants
- HUD (hearts, progress bar, coins, distance) → `_buildHUD` / `_refreshHUD` in
  `GameScene.js`
- Win/lose conditions → `_checkWin` / `_triggerWin` / `_triggerGameOver` in
  `GameScene.js`
- Menu / end screens & Arabic copy → `MenuScene.js`, `WinScene.js`,
  `GameOverScene.js`
- Add audio → `BootScene.preload()` (load files into `assets/audio/`) using the
  sound keys the code already references
