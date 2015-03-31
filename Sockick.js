/*=====================================================
  Declared as literal object (All variables are static)	  
  =====================================================*/
var Sockick = {
	BALL_RADIUS: 16,
	HEIGHT : 636,
	WIDTH : 1000,
	GATE_WIDTH: 180,
	GAME_DURATION: 300,
	PORT : 4344,
	FRAME_RATE : 25,			// frame rate of Sockick game
	SERVER_NAME : "localhost"	// server name of Sockick game
	//SERVER_NAME : "172.28.179.28"	// server name of Sockick game
}

// For node.js require
global.Sockick = Sockick;