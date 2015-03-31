function Player() {
	this.x;
	this.y;
	this.skillCd;
	this.isMoving;
	this.vx;
	this.vy;
	this.speed;
	this.weight;
	this.isReversed;
	this.isFreezed;
	this.skill;

	this.init = function(x, y, skill) {
		this.x = x;
		this.y = y;
		this.skill = skill;
		this.skillCd = 30;
		this.isMoving = false;
		this.vx = 0;
		this.vy = 0;
		this.speed = 0;
		this.weight = 10;
		this.isFreezed = false;
		this.isReversed = false;
	} 
}