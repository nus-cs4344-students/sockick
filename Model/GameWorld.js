"use strict";
function GameWorld() {
	this.leftScore;
	this.rightScore;
	this.timeLeft;
	this.gateWidth;
	this.width;
	this.height;

	// constructor
    var that = this;
    this.leftScore = 0;
    this.rightScore = 0;
    this.timeLeft = Sockick.GAME_DURATION;
    this.gateWidth = Sockick.gateWidth;
    this.width = Sockick.WIDTH;
    this.height = Sockick.HEIGHT;

    /*
     * priviledged method: reset()
     */
    this.reset = function(){
        this.leftScore = 0;
	    this.rightScore = 0;
	    this.timeLeft = Sockick.GAME_DURATION;
    }
}