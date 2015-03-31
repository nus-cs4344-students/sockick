"use strict";
function Player() {
	this.x;
	this.y;
	this.vx;
	this.vy;
	this.weight;
	// this.isReversed;
	// this.isFreezed;

	this.init = function(x, y) {
		this.x = x;
		this.y = y;
		this.vx = 0;
		this.vy = 0;
		this.weight = 70;
		// this.isFreezed = false;
		// this.isReversed = false;
	} 
}