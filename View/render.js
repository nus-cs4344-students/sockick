function Render() {
	this.stage = new createjs.Stage("gameStage");
	this.initDrawing();
}

Render.prototype.initDrawing = function(){
	///draw.....
	var circle = new createjs.Shape();
	circle.graphics.beginFill("DeepSkyBlue").drawCircle(0, 0, 50);
	circle.x = 100;
	circle.y = 100;
	this.stage.addChild(circle);
	this.stage.update();
}