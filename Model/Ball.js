"use strict";
function Ball() {
	this.weight;
	this.x;
	this.y;
	this.vx;
	this.vy;
	this.angularVelocity;
	this.radius;
	this.velocityUpdated;
	this.ghostWalkLoopsLeft = 0;

	this.reset = function() {
		this.vx = 0;
		this.vy = 0;
		this.x;
		this.y;
	}

	// constructor
    var that = this;
    this.vx = 0;
    this.vy = 0;
    this.x = Sockick.WIDTH/2;
    this.y = Sockick.HEIGHT/2;
    this.velocityUpdated = false;
    this.angularVelocity = 0;
    this.radius = Sockick.BALL_RADIUS;
    this.weight = Ball.WEIGHT;

    /*
     * priviledged method: reset()
     */
    this.reset = function(){
        this.vx = 0;
        this.vy = 0;
        this.x = Sockick.WIDTH/2;
	    this.y = Sockick.HEIGHT/2;
	    this.angularVelocity = 0;
    }
}

// For node.js require
global.Ball = Ball;