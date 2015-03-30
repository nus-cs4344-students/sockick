function Render() {
	this.stage;
	this.scoreBoard;
	this.width;
	this.height;

	this.init = function() {
		// prevent scrolling
		document.onkeydown = function(evt) {
			evt = evt || window.event;
			var keyCode = evt.keyCode;
			if (keyCode >= 37 && keyCode <= 40) {
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
		var text_score = new createjs.Text("0 : 0", "40px Comic Sans MS", "#000000");
		var textScoreWidth = text_score.getMeasuredWidth();
		text_score.x = 500-textScoreWidth/2;
		text_score.y = 35;
		text_score.textBaseline = "alphabetic";
		this.scoreBoard.addChild(text_score);

		var text_timeleft = new createjs.Text("Time Left\n10:00 Min", "40px Comic Sans MS", "#000000");
		var textTimeWidth = text_timeleft.getMeasuredWidth();
		text_timeleft.x = 1000-textTimeWidth/2;
		text_timeleft.y = 35;
		text_timeleft.textBaseline = "alphabetic";
		this.scoreBoard.addChild(text_timeleft);

		// var wasd = new createjs.Bitmap("Assets/wasd.png");
		// wasd.scaleX = 0.5;
		// wasd.scaleY = 0.5;
		// this.scoreBoard.addChild(wasd);

		// start to tick
		createjs.Ticker.addEventListener("tick", this.handleTick);

	}
	this.handleTick = function(event) {

		renderer.stage.update();
		renderer.scoreBoard.update();
	}
}

var renderer = new Render();
renderer.init();