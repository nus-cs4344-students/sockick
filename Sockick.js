/*=====================================================
  Declared as literal object (All variables are static)	  
  =====================================================*/
var Sockick = {
	HEIGHT : 590,
	WIDTH : 915,
	GATE_WIDTH: 160,
	GAME_DURATION: 300,
	PORT : 4344,
	FRAME_RATE : 25,			// frame rate of Sockick game
	SERVER_NAME : "localhost"	// server name of Sockick game
	//SERVER_NAME : "172.28.179.28"	// server name of Sockick game
}

// For node.js require
global.Sockick = Sockick;

// vim:ts=4
