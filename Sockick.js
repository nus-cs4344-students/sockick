/*=====================================================
  Declared as literal object (All variables are static)	  
  =====================================================*/
var Sockick = {
	PLAYER_DELAY: 0,
	HEIGHT : 594,
	WIDTH : 916,
	GATE_WIDTH: 180,
	GAME_DURATION: 120,
	PORT : 4344,
	FRAME_RATE : 60,			// frame rate of Sockick game
	// SERVER_NAME : "localhost",	// server name of Sockick game
	SERVER_NAME : "172.23.41.172",	// server name of Sockick game

	AVERAGE_RUNE_GENERATION_TIME: 5,
	RUNE_EFFECT_DURATION: 10,
	// Constants:
	PLAYER_RADIUS : 64,
	PLAYER_WEIGHT : 140,
	PLAYER_HEIGHT: 210,
	PLAYER_WIDTH: 142,
	PLAYER_FRICTION_AIR: 0.05,
	PLAYER_FRICTION: 0.02,
	PLAYER_DENSITY: 0.01,
	PLAYER_SPEED: 10,

	BALL_RADIUS: 32,
	BALL_WEIDHT: 1,
	BALL_RESTITUTION: 0.0,

	MAXIMUM_PLAYER : 4,

	RUNE_TYPE_HASTE: 0,
	RUNE_TYPE_HEAVY: 1,
	RUNE_TYPE_REVERSE: 2,
	RUNE_TYPE_FROZEN: 3,
	RUNE_DIMENSION: 50,

	DELTA_T: 10,
}

// For node.js require
global.Sockick = Sockick;