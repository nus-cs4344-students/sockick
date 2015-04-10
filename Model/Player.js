"use strict";
function Player(sid, pid) {

    // Properties used by the network:
    this.sid;       // Socket id. Used to uniquely identify players via the socket they are connected from
    this.pid;       // Player id. In this case, 1 to 4 
    this.delay;     // player's delay 
    this.lastUpdated; // timestamp of last position update
    this.gameModel;

    // Properties Of model:
	this.x;
	this.y;
	this.vx;
	this.vy;
	this.weight;
	this.radius;
    this.pid;

	// this.isReversed;
	// this.isFreezed;
	
    // Constructor
    var that = this;
    this.sid = sid;
    this.pid = pid;
    this.delay = 0;
    this.lastUpdated = new Date().getTime();

    this.vx = 0;
    this.vy = 0;
    this.x = 200;
    this.y = Sockick.HEIGHT/2;
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

// For node.js require
global.Player = Player;
