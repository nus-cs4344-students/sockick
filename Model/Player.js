"use strict";
function Player() {
	this.x;
	this.y;
	this.vx;
	this.vy;
	this.weight;
	this.radius;
	// this.isReversed;
	// this.isFreezed;
	var that = this;
    this.vx = 0;
    this.vy = 0;
    this.x = 50;
    this.y = 50;
    this.radius = Player.RADIUS;
    this.weight = Player.WEIGHT;

    /*
     * priviledged method: reset()
     */
    this.reset = function(){
        this.vx = 0;
        this.vy = 0;
        this.x = 50;
	    this.y = 50;
    }
}


// Static variables
Player.RADIUS = 30;
Player.WEIGHT = 140;

// For node.js require
global.Player = Player;