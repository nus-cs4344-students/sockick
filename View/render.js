function Render() {
	this.stage;
	this.scoreBoard;
	this.width;
	this.height;
	this.text_score;
	this.text_timeleft;
	this.players = {};
	this.my_id;
	this.myLabel;
	this.ballAnimation;

	this.init = function() {


		// setup main stage
		this.stage = new createjs.Stage("gameStage");

		// grab canvas width and height
		this.width = this.stage.canvas.width;
		this.height = this.stage.canvas.height;

		// add soccer field
		var soccerFieldImage = new createjs.Bitmap("Assets/soccer-field.png");
		this.stage.addChild(soccerFieldImage);


		// setup score board
		this.scoreBoard = new createjs.Stage("scoreBoard");
		this.text_score = new createjs.Text("0 : 0", "40px Comic Sans MS", "#000000");
		var textScoreWidth = this.text_score.getMeasuredWidth();
		this.text_score.x = 500 - textScoreWidth / 2;
		this.text_score.y = 35;
		this.text_score.textBaseline = "alphabetic";
		this.scoreBoard.addChild(this.text_score);

		this.text_timeleft = new createjs.Text("Time Left\n10:00 Min", "40px Comic Sans MS", "#000000");
		var textTimeWidth = this.text_timeleft.getMeasuredWidth();
		this.text_timeleft.x = 1000 - textTimeWidth / 2;
		this.text_timeleft.y = 35;
		this.text_timeleft.textBaseline = "alphabetic";
		this.scoreBoard.addChild(this.text_timeleft);

		// var wasd = new createjs.Bitmap("Assets/wasd.png");
		// wasd.scaleX = 0.5;
		// wasd.scaleY = 0.5;
		// this.scoreBoard.addChild(wasd);

		// bonus list
		// freeze
		var circleBlue = new createjs.Shape();
		circleBlue.graphics.beginFill("DeepSkyBlue").drawCircle(0, 0, 8);
		circleBlue.x = 10;
		circleBlue.y = 10;
		this.scoreBoard.addChild(circleBlue);

		var text_freeze = new createjs.Text("Freeze", "16px Comic Sans MS", "#000000");
		text_freeze.x = 30;
		text_freeze.y = -2;
		this.scoreBoard.addChild(text_freeze);

		// speed up
		var circleBlue = new createjs.Shape();
		circleBlue.graphics.beginFill("Red").drawCircle(0, 0, 8);
		circleBlue.x = 10;
		circleBlue.y = 30;
		this.scoreBoard.addChild(circleBlue);

		var text_speedup = new createjs.Text("Speed Up", "16px Comic Sans MS", "#000000");
		text_speedup.x = 30;
		text_speedup.y = 18;
		this.scoreBoard.addChild(text_speedup);

		// weight up
		var circleBlue = new createjs.Shape();
		circleBlue.graphics.beginFill("Yellow").drawCircle(0, 0, 8);
		circleBlue.x = 10;
		circleBlue.y = 50;
		this.scoreBoard.addChild(circleBlue);

		var text_weightup = new createjs.Text("Weight Up", "16px Comic Sans MS", "#000000");
		text_weightup.x = 30;
		text_weightup.y = 38;
		this.scoreBoard.addChild(text_weightup);

		// skill refresh
		var circleBlue = new createjs.Shape();
		circleBlue.graphics.beginFill("Green").drawCircle(0, 0, 8);
		circleBlue.x = 10;
		circleBlue.y = 70;
		this.scoreBoard.addChild(circleBlue);

		var text_refresh = new createjs.Text("Refresh", "16px Comic Sans MS", "#000000");
		text_refresh.x = 30;
		text_refresh.y = 58;
		this.scoreBoard.addChild(text_refresh);

		// reverse
		var circleBlue = new createjs.Shape();
		circleBlue.graphics.beginFill("Purple").drawCircle(0, 0, 8);
		circleBlue.x = 10;
		circleBlue.y = 90;
		this.scoreBoard.addChild(circleBlue);

		var text_reverse = new createjs.Text("Reverse", "16px Comic Sans MS", "#000000");
		text_reverse.x = 30;
		text_reverse.y = 78;
		this.scoreBoard.addChild(text_reverse);

		// create player
		// this.createPlayer();
		// this.stage.addChild(this.playerAnimation);

		// create ball
		this.createBall();
		this.stage.addChild(this.ballAnimation);

		// start to tick
		createjs.Ticker.addEventListener("tick", this.handleTick);

	}
	this.setScore = function(scoreLeft, scoreRight) {
		this.text_score.text = scoreLeft + ' : ' + scoreRight;
		var width = this.text_score.getMeasuredWidth();
		this.text_score.x = 500 - width / 2;

	}
	this.setTimeLeft = function(timeleft) {
		if (timeleft.length == 4)
			this.text_timeleft.text = "Time Left\n " + timeleft + " Min";
		else
			this.text_timeleft.text = "Time Left\n" + timeleft + " Min";
		var textTimeWidth = this.text_timeleft.getMeasuredWidth();
		this.text_timeleft.x = 1000 - textTimeWidth / 2;
	}

	this.handleTick = function(event) {

		renderer.stage.update();
		renderer.scoreBoard.update();
	}

	this.addFlag = function(x, y){
		if(x < this.stage.canvas.width/2){
			var flag = new createjs.Bitmap("Assets/flag-left.png");
			flag.x = 28;
			flag.y = 230;
		}
		else{
			var flag = new createjs.Bitmap("Assets/flag-right.png");
			flag.x = this.stage.canvas.width - 28;
			flag.y = 230;
		}
		this.stage.addChild(flag);
	}

	this.createPlayer = function(pid, isMyself, x, y) {
		var imagePath;
		if (x < this.stage.canvas.width/2)
			imagePath = "Assets/player2.png";
		else
			imagePath = "Assets/player1.png"
		var data = {
			images: [imagePath],

			frames: {
				width: Sockick.PLAYER_WIDTH,
				height: Sockick.PLAYER_HEIGHT,
				count: 28
			},
			animations: {
				stay_left: 0,
				stay_right: 7,
				stay_up: 21,
				stay_down: 14,
				left: [0, 6],
				right: [7, 13],
				down: [14, 20],
				up: [21, 27],
				left_up: [0, 21, 1, 22, 2, 23, 3, 24, 4, 25, 5, 26, 6, 27],
				left_down: [0, 14, 1, 15, 2, 16, 3, 17, 4, 18, 5, 19, 6, 20],
				right_up: [7, 21, 8, 22, 9, 23, 10, 24, 11, 25, 12, 26, 13, 27],
				right_down: [7, 14, 8, 15, 9, 16, 10, 17, 11, 18, 12, 19, 13, 20]
			}
		};
		var spriteSheet = new createjs.SpriteSheet(data);
		var playerAnimation = new createjs.Sprite(spriteSheet, "stay_left");
		playerAnimation.shadow = new createjs.Shadow("#0E140F", 5, 5, 4);
		playerAnimation.x = x;
		playerAnimation.y = y;
		this.players[pid] = playerAnimation;
		this.stage.addChild(playerAnimation);

		if (isMyself) {
			this.my_id = pid;
			this.meArrow = new createjs.Bitmap("Assets/arrow.png");
			this.meArrow.scaleX = 0.5;
			this.meArrow.scaleY = 0.5;
			this.stage.addChild(this.meArrow);
			this.meArrow.x = playerAnimation.x;
			this.meArrow.y = playerAnimation.y - 50;
			this.addFlag(x, y);
		}
	}
	this.createBall = function() {
		var data = {
			images: ["Assets/ball.png"],
			frames: {
				width: Sockick.BALL_RADIUS * 2,
				height: Sockick.BALL_RADIUS * 2,
				count: 28
			},
			animations: {
				stand: [0],
				run: [0, 6]
			}
		};
		var spriteSheet = new createjs.SpriteSheet(data);
		this.ballAnimation = new createjs.Sprite(spriteSheet, "stand");
	}

	this.updatePlayers = function(pid, x, y) {

		var heightOffset = 60;
		var dx = x - (Sockick.PLAYER_WIDTH / 2) - this.players[pid].x;
		var dy = y - Sockick.PLAYER_HEIGHT + heightOffset - this.players[pid].y;
		if(Math.abs(dx) < 1)
			dx = 0;
		if(Math.abs(dy) < 1)
			dy = 0;
		this.players[pid].x = x;
		this.players[pid].y = y;


		var preX = x, preY = y;
		
	//	console.log(this.players[pid].currentAnimation);
		if (dx == 0 && dy == 0){
			this.players[pid].stop();
		}
		else{
		if (dx == 0 && dy > 0){
			if (this.players[pid].currentAnimation != "down") {
				this.players[pid].gotoAndPlay("down");
				// console.log("down",dx, dy);
			}
			
		}
		if (dx == 0 && dy < 0){
			if (this.players[pid].currentAnimation != "up") {
				this.players[pid].gotoAndPlay("up");
				// console.log("up",dx, dy);
			}
		}
		if (dx > 0 && dy == 0){
			if (this.players[pid].currentAnimation != "right") {
				this.players[pid].gotoAndPlay("right");
				// console.log("right",dx, dy);
			}
		}
		if (dx > 0 && dy > 0){
			if (this.players[pid].currentAnimation != "right_down") {
				this.players[pid].gotoAndPlay("right_down");
			}
		}
		if (dx > 0 && dy < 0){
			if (this.players[pid].currentAnimation != "right_up") {
				this.players[pid].gotoAndPlay("right_up");
			}
		//	this.players[pid].gotoAndPlay("right_up");
		}
		if (dx < 0 && dy == 0){
			if (this.players[pid].currentAnimation != "left") {
				this.players[pid].gotoAndPlay("left");
				// console.log("left",dx, dy);
			}
			//this.players[pid].gotoAndPlay("left");
		}
		if (dx < 0 && dy > 0){
			if (this.players[pid].currentAnimation != "left_down") {
				this.players[pid].gotoAndPlay("left_down");
			}

		}
		if (dx < 0 && dy < 0){
			if (this.players[pid].currentAnimation != "left_up") {
				this.players[pid].gotoAndPlay("left_up");
			}
			// this.players[pid].gotoAndPlay("left_up");
		}

		if (dx != 0 || dy != 0){
			//console.log("moving");
		}
	}
		this.players[pid].x = x - (Sockick.PLAYER_WIDTH / 2);
		this.players[pid].y = y - Sockick.PLAYER_HEIGHT + heightOffset;
		// this.players[pid].setTransform(x,y);
		// console.log(this.my_id);
		if (pid == this.my_id) {
			this.meArrow.x = x - 30;; 
			this.meArrow.y = this.players[pid].y - 50;
		}
	}

	this.deletePlayer = function(pid) {
		this.stage.removeChild(this.players[pid]);
		this.stage.update();
	}

	this.updateBall = function(x, y) {
		var dx = x - Sockick.BALL_RADIUS -this.ballAnimation.x,
			dy = y - Sockick.BALL_RADIUS - this.ballAnimation.y;

		if(Math.abs(dx) < 0.5)
			dx = 0;
		if(Math.abs(dy) < 0.5)
			dy = 0;

		if(dx == 0 && dy == 0){
			if (this.ballAnimation.currentAnimation !== "stand") {
				this.ballAnimation.gotoAndPlay("stand");
			}

		}
		else{
			if (this.ballAnimation.currentAnimation !== "run") {
				this.ballAnimation.gotoAndPlay("run");
			}
		}

/*		if (x - Sockick.BALL_RADIUS != this.ballAnimation.x ||
			y - Sockick.BALL_RADIUS != this.ballAnimation.y) {
			if (this.ballAnimation.currentAnimation !== "run") {
				this.ballAnimation.gotoAndPlay("run");
			}
		} else {
			if (this.ballAnimation.currentAnimation !== "stand") {
				this.ballAnimation.gotoAndPlay("stand");
			}
		}*/
		this.ballAnimation.x = x - Sockick.BALL_RADIUS;
		this.ballAnimation.y = y - Sockick.BALL_RADIUS;
	}
}

// var renderer = new Render();
// renderer.init();