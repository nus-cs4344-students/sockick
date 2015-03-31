function Render() {
	this.stage;
	this.scoreBoard;
	this.width;
	this.height;
	this.text_score;
	this.text_timeleft;
	this.playerAnimation;
	this.ballAnimation;

	this.init = function() {
		// prevent scrolling
		document.onkeydown = function(evt) {
			evt = evt || window.event;
			var keyCode = evt.keyCode;
			if (keyCode == 37) {
				console.log("left");
				renderer.playerAnimation.gotoAndPlay("left");
				renderer.playerAnimation.x -= 20;
				return false;
			}
			if (keyCode == 38) {
				console.log("up");
				renderer.playerAnimation.gotoAndPlay("up");
				renderer.playerAnimation.y -= 20;
				return false;
			}
			if (keyCode == 39) {
				console.log("right");
				renderer.playerAnimation.gotoAndPlay("right");
				renderer.playerAnimation.x += 20;
				return false;
			}
			if (keyCode == 40) {
				console.log("down");
				renderer.playerAnimation.gotoAndPlay("down");
				renderer.playerAnimation.y += 20;
				return false;
			}
		};

		document.onkeyup = function(evt) {
			evt = evt || window.event;
			var keyCode = evt.keyCode;
			if (keyCode == 37) {
				renderer.playerAnimation.gotoAndPlay("left_stay");
				renderer.playerAnimation.x -= 20;
				return false;
			}
			if (keyCode == 38) {
				renderer.playerAnimation.gotoAndPlay("up_stay");
				renderer.playerAnimation.y -= 20;
				return false;
			}
			if (keyCode == 39) {
				renderer.playerAnimation.gotoAndPlay("right_stay");
				renderer.playerAnimation.x += 20;
				return false;
			}
			if (keyCode == 40) {
				renderer.playerAnimation.gotoAndPlay("down_stay");
				renderer.playerAnimation.y += 20;
				return false;
			}
		};


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
		this.createPlayer();
		this.stage.addChild(this.playerAnimation);

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

	this.createPlayer = function() {
		var data = {
			images: ["Assets/player2.png"],
			frames: {
				width: 142,
				height: 210,
				count: 28
			},
			animations: {
				left: [0,6],
				right: [7, 13],
				down: [14,20],
				up:[21,27],
				left_stay: 6,
				right_stay: 13,
				down_stay: 14,
				up_stay: 25
			}
		};
		var spriteSheet = new createjs.SpriteSheet(data);
		this.playerAnimation = new createjs.Sprite(spriteSheet, "left_stay");
	}

	this.createBall = function() {
		var data = {
			images: ["Assets/ball.png"],
			frames: {
				width: 64,
				height: 64,
				count: 28
			},
			animations: {
				stand: [0],
				run: [0,6]
			}
		};
		var spriteSheet = new createjs.SpriteSheet(data);
		this.ballAnimation = new createjs.Sprite(spriteSheet, "stand");
	}
}

var renderer = new Render();
renderer.init();