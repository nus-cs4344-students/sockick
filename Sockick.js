/*=====================================================
  Declared as literal object (All variables are static)	  
  =====================================================*/
var Sockick = {
	HEIGHT : 594,
	WIDTH : 916,
	GATE_WIDTH: 180,
	GAME_DURATION: 300,
	PORT : 4344,
	FRAME_RATE : 60,			// frame rate of Sockick game
	SERVER_NAME : "localhost",	// server name of Sockick game
	//SERVER_NAME : "172.28.179.28",	// server name of Sockick game

	// Constants:
	PLAYER_RADIUS : 64,
	PLAYER_WEIGHT : 140,
	PLAYER_HEIGHT: 210,
	PLAYER_WIDTH: 142,

	BALL_RADIUS: 32,
	BALL_WEIDHT: 1,
	BALL_RESTITUTION: 0.0,

}

// For node.js require
global.Sockick = Sockick;