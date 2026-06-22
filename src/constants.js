export const GAME_WIDTH  = 1280;
export const GAME_HEIGHT = 720;

// Ground surface Y (where character's feet land)
export const GROUND_Y    = 665;
// Fixed horizontal position of the player
export const PLAYER_X    = 210;

// Character spritesheet frame dimensions
export const CHAR_FRAME_W = 112;
export const CHAR_FRAME_H = 150;

// Run animation
export const RUN_FRAMES  = 16;
export const JUMP_FRAMES = 25;

// Physics
export const GRAVITY        = 1100;
export const JUMP_VELOCITY  = -650; // first jump
export const JUMP2_VELOCITY = -580; // double-jump (slightly weaker)

// Scroll speed (px / sec)
export const INITIAL_SPEED     = 280;
export const MAX_SPEED         = 540;
export const SPEED_INCREMENT   = 2.8; // added per second

// Lives & invincibility
export const LIVES_MAX         = 3;
export const INVINCIBILITY_MS  = 1600;

// Win condition
export const WIN_DISTANCE = 26000; // pixels (~100 s average)
export const MIN_COINS    = 50;

// Obstacle types
export const OBSTACLE_TYPES = ['relative', 'bills', 'gossip', 'traffic', 'crowd'];
export const SPAWN_MIN_MS   = 950;
export const SPAWN_MAX_MS   = 2400;

// Coin spawning
export const COIN_SPAWN_MIN_MS = 750;
export const COIN_SPAWN_MAX_MS = 1700;
