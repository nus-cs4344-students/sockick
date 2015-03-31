var runnerCells = [
		[0,  0, 183, 227],
		[183, 0,192, 227],
		[375, 0, 175,227],
		[550, 0, 176, 227],
		[726, 0, 176, 227],
		[0, 227,183, 227],
		[183, 227, 192,227]
	];
var vX = 5;
var direction = 90;
var data1 = {
	framerate: 30,
    images: ["3-side-right.png"],
    frames: runnerCells,
    animations: {
/*        stand:0,
        run:[1,5],
        jump:[6,8,"run"]
*/    
		right:[0,6,"right", 2]
	}
},

	data2 = {
		framerate: 30,
	    images: ["3-side-left.png"],
	    frames: runnerCells,
	    animations: {
	/*        stand:0,
	        run:[1,5],
	        jump:[6,8,"run"]
	*/    
			left:[0,6,"left", 2]
		}
	}
var spriteSheet_right1 = new createjs.SpriteSheet(data1);
var spriteSheet_left1 = new createjs.SpriteSheet(data2);
createjs.SpriteSheetUtils.addFlippedFrames(spriteSheet_right1, true, false, false);
var instance_right1 = new createjs.Sprite(spriteSheet_right1);
var instance_left1 = new createjs.Sprite(spriteSheet_left1);
setSprite(instance_right1, 100, 100);
setSprite(instance_left1, 100, 100);


function setSprite(instance, x, y){
	//instance_righ1.gotoAndPlay(aniName);

	instance.scaleX = 0.5;
	instance.scaleY = 0.5;	

	instance.x = x;
	instance.y = y;	

	instance.shadow = new createjs.Shadow("#454", 0, 5, 4);

	instance.currentFrame = 0;


}

/* // create a BitmapAnimation instance to display and play back the sprite sheet:
bmpAnimation = new createjs.BitmapAnimation(spriteSheet);
// start playing the first sequence:
bmpAnimation.gotoAndPlay("right");     //animate

// set up a shadow.
bmpAnimation.shadow = new createjs.Shadow("#454", 0, 5, 4);

bmpAnimation.name = "player1";
bmpAnimation.direction = 90;
bmpAnimation.vX = 1;
bmpAnimation.x = 0;
bmpAnimation.y = 32;

// have each monster start at a specific frame
bmpAnimation.currentFrame = 0;
stage.addChild(bmpAnimation);*/

var charactorX = 100;
var currentSpirt = instance_right1;
function tick(event) {
	
	console.log("??? "+charactorX);
    // Hit testing the screen width, otherwise our sprite would disappear
    if (charactorX >= 400) {
    	currentSpirt = instance_left1;
    	console.log("left");
    	//instance_right1.gotoAndStop("left");
    	stage.removeChild(instance_right1);
    	stage.addChild(instance_left1);
        // We've reached the right side of our screen
        // We need to walk left now to go back to our initial position
        direction = -90;
        instance_left1.gotoAndPlay("left");
        charactorX = updatePosition(direction,charactorX);
        instance_left1.x = charactorX;
    }

    else if (charactorX <= 100) {
    	currentSpirt = instance_right1;
        // We've reached the left side of our screen
        // We need to walk right now
       // instance_left1.gotoAndStop("left");
    	stage.removeChild(instance_left1);
    	stage.addChild(instance_right1);
        console.log("right_h");
        direction = 90;

        instance_right1.gotoAndPlay("right");
        charactorX = updatePosition(direction,charactorX);
        instance_right1.x = charactorX;
    }
    else{
    	charactorX = updatePosition(direction,charactorX);
    	currentSpirt.x = charactorX;
    }

    // update the stage:
    stage.update();
}

function updatePosition(direction, charactorX){
	// Moving the sprite based on the direction & the speed
    if (direction == 90) {
        charactorX += vX;

    }
    else {
        charactorX -= vX;
    }
    console.log(charactorX);
    return charactorX;
}
// start to tick
	createjs.Ticker.addEventListener("tick", tick);
	createjs.Ticker.useRAF = true;
	// Best Framerate targeted (60 FPS)
//	createjs.Ticker.setFPS(60);
