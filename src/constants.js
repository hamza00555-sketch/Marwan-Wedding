export const GAME_WIDTH  = 1280;
export const GAME_HEIGHT = 720;

// Ground surface Y — the sidewalk pavement line the player runs on
export const GROUND_Y = 640;
// Fixed horizontal position of the player
export const PLAYER_X = 230;

// Character spritesheet frame dimensions (560x752 art at 1/4 scale)
export const CHAR_FRAME_W = 140;
export const CHAR_FRAME_H = 188;

// Character physics body inside the frame
export const BODY_W     = 72;
export const BODY_H     = 158;
export const BODY_OFF_X = 34;
export const BODY_OFF_Y = 16;

// Animations (trimmed frame counts for a fast stride)
export const RUN_FRAMES  = 8;
export const JUMP_FRAMES = 15;

// Physics
export const GRAVITY        = 1150;
export const JUMP_VELOCITY  = -680; // first jump
export const JUMP2_VELOCITY = -600; // double-jump (slightly weaker)

// Scroll speed (px / sec) — fast runner
export const INITIAL_SPEED   = 400;
export const MAX_SPEED       = 760;
export const SPEED_INCREMENT = 4.5; // added per second

// Lives & invincibility
export const LIVES_MAX        = 3;
export const INVINCIBILITY_MS = 1600;

// Win condition
export const WIN_DISTANCE = 36000; // px (~65 s at average speed)
export const MIN_COINS    = 50;

// Obstacle types
export const OBSTACLE_TYPES = ['relative', 'bills', 'gossip', 'traffic', 'crowd'];
export const SPAWN_MIN_MS   = 800;
export const SPAWN_MAX_MS   = 1900;

// Coin spawning
export const COIN_SPAWN_MIN_MS = 650;
export const COIN_SPAWN_MAX_MS = 1400;
export const BIG_COIN_VALUE    = 5;

// Power-ups
export const POWERUP_TYPES        = ['magnet', 'shield', 'coinbag'];
export const POWERUP_SPAWN_MIN_MS = 8000;
export const POWERUP_SPAWN_MAX_MS = 14000;
export const MAGNET_DURATION_MS   = 6500;
export const MAGNET_RADIUS        = 320;

// Coin combo chain
export const COMBO_WINDOW_MS = 1600;

// Near-miss detection (px gap between hitboxes)
export const NEAR_MISS_GAP = 48;

// Scoring
export const HIGHSCORE_KEY = 'marwan-highscore';

// Depth layers (map back-to-front)
export const DEPTH = {
  SKY: 0, SKY_SUNSET: 1, BUILDINGS: 2, WEDDING: 3, SIDEWALK: 4,
  WORLD: 6, PLAYER: 7, FX: 9, HUD: 10, BANNER: 15
};
