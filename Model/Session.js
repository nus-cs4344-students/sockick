function Session(sessionId){
    this.sessionId = sessionId;
    this.count = 0;        // Keeps track how many people are connected to server 
    this.nextPID = 1;      // PID to assign to next connected player (i.e. which player slot is open) 
    this.gameInterval = undefined; // Interval variable used for gameLoop 
    this.sockets = new Object;      // Associative array for sockets, indexed via player ID, an integer
    this.players = new Object;      // Associative array for players, indexed via socket ID, a complexed string
    this.p1;
    this.p2;
    this.p3;
    this.p4;       // Players
    this.ball;         // the game football 

    this.Engine = Matter.Engine;
    this.World = Matter.World;
    this.Bodies = Matter.Bodies;
    this.engine;
    this.leftScore = 0;
    this.rightScore = 0;
    this.gameTicksLeft = Sockick.GAME_DURATION * Sockick.FRAME_RATE;
    this.runeType;
    this.runePositionX;
    this.runePositionY;
    this.hit = false;
    this.hitPlayer;
    this.speed = new Object;
    this.runeEffectEndTick = Sockick.GAME_DURATION * Sockick.FRAME_RATE;
    this.hasRune = false;
    this.direction = new Object;

    this.lastBallSpeed;

    var that = this;

    /*
     * private method: broadcast(msg)
     *
     * broadcast takes in a JSON structure and send it to
     * all players.
     *
     * e.g., broadcast({type: "abc", x: 30});
     */
    this.broadcast = function (msg) {
        var id;
        for (id in that.sockets) {
            that.sockets[id].write(JSON.stringify(msg));
        }
    }

    /*
     * private method: unicast(socket, msg)
     *
     * unicast takes in a socket and a JSON structure 
     * and send the message through the given socket.
     *
     * e.g., unicast(socket, {type: "abc", x: 30});
     */
    this.unicast = function (socket, msg) {
        socket.write(JSON.stringify(msg));
    }

    this.reset = function () {
        if (that.gameInterval !== undefined) {
            clearInterval(that.gameInterval);
            that.gameInterval = undefined;
            
        }
    }

    this.reStart = function() {
        that.reset();
        that.leftScore = 0;
        that.rightScore = 0;
        that.gameTicksLeft = Sockick.GAME_DURATION * Sockick.FRAME_RATE;
    }

    this.createPlayer = function (conn) {
        
        that.count ++;

        var initialPosition = (that.nextPID % 2 === 1) ? "left" : "right";
        var startPos = that.initialisePlayerPosition(that.nextPID);

        // Send message to new player (the current client)
        that.unicast(conn, {type: "message", content:"You are Player " + that.nextPID + ". Your position is at the " + initialPosition});

        var newPlayer = new Player(conn.id, that.nextPID);
        var gameModel = that.createGameModelForNewPlayer(startPos);
        newPlayer.gameModel = gameModel;
        that.World.addBody(that.engine.world, gameModel);

        that.players[conn.id] = newPlayer; // conn.id is a complex string
        that.sockets[that.nextPID] = conn; // nextPID is an integer
        that.speed[that.nextPID] = Sockick.PLAYER_SPEED;

        console.log("A new player joined with pid: " + that.nextPID);

        // Update the players with the new player:
        var others = that.getAllOtherPlayersOtherThan(newPlayer.pid);

        var states = {
            type: "add_player",
            pid: newPlayer.pid,
            is_self: false,
            position: {
                x: newPlayer.gameModel.position.x,
                y: newPlayer.gameModel.position.y,
            },
            other_players: others.map(function(player){
                return {
                    pid: player.pid,
                    position: {
                        x: player.gameModel.position.x,
                        y: player.gameModel.position.y
                    }
                };
            }),
        }

        var statesJSON = JSON.stringify(states);

        for (var i = 0; i < others.length; i++) {
            var newOtherPlayer = others[i];
            setTimeout(that.unicast, newOtherPlayer.delay, that.sockets[newOtherPlayer.pid], states);
            console.log("New user added. Sending " + states.is_self + " to pid: " + newOtherPlayer.pid);
        }

        states = JSON.parse(statesJSON);
        states.is_self = true;
        setTimeout(that.unicast, newPlayer.delay, that.sockets[newPlayer.pid], states);
        console.log("New user added. Sending " + states.is_self + " to pid: " + newPlayer.pid);

        // Mark as player 1 to 4
        if (that.nextPID == 1) {
            that.p1 = that.players[conn.id];
            that.nextPID = 2;
        } else if (that.nextPID == 2) {
            that.p2 = that.players[conn.id];
            that.p2.delay = Sockick.PLAYER_DELAY;
            that.nextPID = 3;
        } else if (that.nextPID == 3){
            that.p3 = that.players[conn.id];
            that.nextPID = 4;
        } else if (that.nextPID == 4){
            that.p4 = that.players[conn.id];
            that.nextPID = 1;
        }
    }

    this.removePlayer = function (conn) {
        // Decrease player counter
        that.count--;

        console.log("Player did quit with conn.id: " + conn.id + " and current nextPID: " + that.nextPID);
        // Set nextPID to quitting player's PID
        that.nextPID = that.players[conn.id].pid;

        console.log("Player did quit. New nextPID: " + that.nextPID);

        // Update players:
        that.broadcast({type: "delete_player", pid: that.players[conn.id].pid});

        // Remove gameModel from engine:
        Matter.Composite.removeBody(that.engine.world, that.players[conn.id].gameModel);

        // Remove player who wants to quit/closed the window
        if (that.players[conn.id] === that.p1) that.p1 = undefined;
        if (that.players[conn.id] === that.p2) that.p2 = undefined;
        if (that.players[conn.id] === that.p3) that.p3 = undefined;                    
        if (that.players[conn.id] === that.p4) that.p4 = undefined;

        delete that.players[conn.id];

        // Stop game if too little players are playing
        if (that.count < 1) {
            that.reset();
        }

        // Sends to everyone connected to server except the client
        that.broadcast({type:"message", content: " There is now " + that.count + " players."});
    }

    this.createGameModelForNewPlayer = function (startPos){
        // Create player object and insert into players with key = conn.id
        // @param: x, y, radius, options, maxSides
        var gameModel = that.Bodies.circle(startPos.x, startPos.y, Sockick.PLAYER_RADIUS, null, 25);
        gameModel.density = Sockick.PLAYER_DENSITY;
        gameModel.frictionAir = Sockick.PLAYER_FRICTION_AIR;
        gameModel.friction = Sockick.PLAYER_FRICTION;
        gameModel.restitution = 0.0;

        return gameModel;
    }

    this.computeTimeLeft = function() {
        var minLeft = Math.floor(Math.floor(that.gameTicksLeft / Sockick.FRAME_RATE) / 60);
        var secLeft = Math.floor(that.gameTicksLeft / Sockick.FRAME_RATE) % 60;
        return minLeft + ":" + secLeft;
    }


    this.gameLoop = function () {
        // Update on player side
        var date = new Date();
        var currentTime = date.getTime();
        that.gameTicksLeft --;
        var timeLeft = that.computeTimeLeft();
        var socketID;
        var player;
        that.goalStatus = that.checkGoal();
        if (that.goalStatus != 0) {
            that.reset();
            Matter.Composite.clear(that.engine.world, false, true);
            that.initializeGameEngine();
            // Add players:
            for (socketID in that.players) {
                player = that.players[socketID]; // socketID === player.sid
                if (player !== undefined){
                    var startPos = that.initialisePlayerPosition(player.pid);
                    var gameModel = that.createGameModelForNewPlayer(startPos);
                    player.gameModel = gameModel;
                    that.World.addBody(that.engine.world, gameModel);
                    console.log("New position: " + player.gameModel.position.x + ", " + player.gameModel.position.y);
                }
            }
            that.startGame();
        }
        if (that.gameTicksLeft == that.runeEffectEndTick) {
            that.clearRuneEffect();
        }

        // Consturct the message:
        var positionUpdates = new Array();
        for (socketID in that.players) {
            player = that.players[socketID]; // socketID === player.sid
            if (player !== undefined){
                positionUpdates.push({
                    pid: player.pid,
                    position: {
                        x: player.gameModel.position.x, 
                        y: player.gameModel.position.y
                    },
                    velocity: {
                        x: player.gameModel.velocity.x,
                        y: player.gameModel.velocity.y
                    }
                });
                if (that.hasRune) {
                    that.hit = that.checkRuneHit(player);
                    if (that.hit) {
                        that.hitPlayer = player;
                        that.hasRune = false;
                        console.log("Hit by " + that.hitPlayer.pid);
                        that.runeEffectEndTick = that.gameTicksLeft - Sockick.RUNE_EFFECT_DURATION * Sockick.FRAME_RATE;
                        if (that.runeType == Sockick.RUNE_TYPE_HASTE) {
                            that.speed[player.pid] = Sockick.PLAYER_SPEED * 2;
                        } else if (that.runeType == Sockick.RUNE_TYPE_HEAVY) {
                            that.hitPlayer.gameModel.density = Sockick.PLAYER_DENSITY * 2;
                        } else if (that.runeType == Sockick.RUNE_TYPE_REVERSE) {
                            if (that.hitPlayer.pid % 2 == 0) {
                                that.direction[1] = true;
                                that.direction[3] = true;
                            } else {
                                that.direction[2] = true;
                                that.direction[4] = true;
                            }
                        } else if (that.runeType == Sockick.RUNE_TYPE_FROZEN) {
                            if (that.hitPlayer.pid % 2 == 0) {
                                that.speed[1] = 0;
                                that.speed[3] = 0;
                            } else {
                                that.speed[2] = 0;
                                that.speed[4] = 0;
                            }
                        }
                    }
                }
            }
        }

        if (!that.hasRune && that.gameTicksLeft < that.runeEffectEndTick) {
            var r = Math.floor((Math.random() * Sockick.AVERAGE_RUNE_GENERATION_TIME * Sockick.FRAME_RATE) + 1);
            if (r == 1) {
                that.hasRune = true;
                that.runeType = Math.floor(Math.random() * 4);
                that.runePositionX = Math.floor(Math.random() * Sockick.WIDTH);
                that.runePositionY = Math.floor(Math.random() * Sockick.HEIGHT);
            }
        }
        

        //var goalStatus = check_goal();

        for (socketID in that.players) {
            player = that.players[socketID]; 
            
            if (player !== undefined) {
                if (that.goalStatus == 0) {
                    if (that.gameTicksLeft == 0) {
                        var states = { 
                            type: "end",
                            timestamp: currentTime,
                            leftscore: that.leftScore,
                            rightscore: that.rightScore
                        };
                        //console.log("State: " + player.position.x + " " + player.position.y);
                        setTimeout(that.unicast, player.delay, that.sockets[player.pid], states);
                        that.reStart();
                    } else {
                        if (r == 1) {
                            var runeMessage = {
                                type: "rune_create",
                                timestamp: currentTime,
                                runetype: that.runeType,
                                x: that.runePositionX,
                                y: that.runePositionY
                            };
                            setTimeout(that.unicast, player.delay, that.sockets[player.pid], runeMessage);
                        }
                        if (that.hit) {
                            var runeHitMessage = {
                                type: "rune_hit",
                                timestamp: currentTime,
                                runetype: that.runeType,
                                playerid: that.hitPlayer.pid
                            };
                            setTimeout(that.unicast, player.delay, that.sockets[player.pid], runeHitMessage);
                        }
                        var states = { 
                            type: "update_players",
                            timestamp: currentTime,
                            timeleft: timeLeft,
                            player_positions: positionUpdates
                        };
                        //console.log("State: " + player.position.x + " " + player.position.y);
                        setTimeout(that.unicast, player.delay, that.sockets[player.pid], states);
                    }
                    
                } else {
                    var states = { 
                        type: "goal",
                        timestamp: currentTime,
                        leftscore: that.leftScore,
                        rightscore: that.rightScore
                    };
                    setTimeout(that.unicast, player.delay, that.sockets[player.pid], states);
                }
            } else{
                console.log("player is undefined now with ID: " + socketID);
            }
        }
        that.hit = false;

        // If the velocity of the ball is changed, tell players:
        if (Math.abs(that.ball.speed - that.lastBallSpeed) > 0.001) {
            var ballPosition = { 
                type: "update_ball",
                timestamp: currentTime,
                ball_position: {x: that.ball.position.x, y: that.ball.position.y},
                ball_velocity: {x: that.ball.velocity.x, y: that.ball.velocity.y},
            }
            // broadcast(ballPosition);
            var id;
            for (id in that.players) {
                player = that.players[id];
                setTimeout(that.unicast, player.delay, that.sockets[player.pid] ,ballPosition);
            }
        }
        that.lastBallSpeed = that.ball.speed;

        that.Engine.update(that.engine, 1000/Sockick.FRAME_RATE);
    }

    this.startGame = function () {

        if (that.gameInterval !== undefined) {
            console.log("Game already playing!");
        } else if (that.count === 1) { // Used to be: Object.keys(players).length, breaks abstraction.
            that.broadcast({type:"message", content:"Not enough player"});
        } else {
            console.log("Starting game...");
            that.gameInterval = setInterval(function() {that.gameLoop();}, 1000/Sockick.FRAME_RATE);
        }

        console.log("In startGame(), player count: " + that.count);     
    }

    this.initializeGameEngine = function () {

        that.engine = that.Engine.create(null, null);

        that.engine.world.gravity = { x: 0, y: 0 };

        var width = Sockick.WIDTH;
        var height = Sockick.HEIGHT;
        var wallThickness = 1000;
        var options =  { isStatic: true,};

        var wallTop = that.Bodies.rectangle(
            width / 2, 
            -wallThickness / 2,
            width + wallThickness * 2, 
            wallThickness, 
            options
        );

        var wallBottom = that.Bodies.rectangle(
            width / 2, 
            height + wallThickness / 2, 
            width + 2 * wallThickness, 
            wallThickness, 
            options
        );

        var wallLeft = that.Bodies.rectangle(
            - wallThickness / 2, 
            height / 2, 
            wallThickness, 
            height, 
            options
        );

        var wallRight = that.Bodies.rectangle(
            width + wallThickness / 2, 
            height / 2, 
            wallThickness, 
            height, 
            options
        );

        wallTop.restitution = 1;
        wallBottom.restitution = 1;
        wallLeft.restitution = 1;
        wallRight.restitution = 1;


        that.ball = that.Bodies.circle(Sockick.WIDTH / 2, Sockick.HEIGHT / 2, Sockick.BALL_RADIUS, null, 25);
        that.ball.frictionAir = 0.0;
        that.ball.friction = 0.01;
        that.ball.restitution = 1;

        that.World.addBody(that.engine.world, that.ball);
                
        that.World.addBody(that.engine.world, wallTop);
        that.World.addBody(that.engine.world, wallBottom);
        that.World.addBody(that.engine.world, wallRight);
        that.World.addBody(that.engine.world, wallLeft);

    }

    this.playerChangeDirection = function(player, newDirection){
        console.log(newDirection);
        player.gameModel.frictionAir = 0.00;
        player.gameModel.friction = 0.00;
        switch (newDirection){
            case "left":{
                that.modelMoveLeft(player);
                break;
            }
            case "up":{
                that.modelMoveUp(player);
                break;
            }
            case "right":{
                that.modelMoveRight(player);
                break;
            }
            case "down":{
                that.modelMoveDown(player);
                break;
            }
            case "up_right":{
                that.modelMoveUp(player);
                that.modelMoveRight(player);
                break;
            }
            case "up_left":{
                that.modelMoveUp(player);
                that.modelMoveLeft(player);
                break;
            }
            case "down_right":{
                that.modelMoveDown(player);
                that.modelMoveRight(player);
                break;
            }
            case "down_left":{
                that.modelMoveDown(player);
                that.modelMoveLeft(player);
                break;
            }
            case "stop":{
                player.gameModel.friction = Sockick.PLAYER_FRICTION;
                player.gameModel.frictionAir = Sockick.PLAYER_FRICTION_AIR;
                that.modelStop(player);

                var message = {
                    type: "update_self",
                    pid: player.pid,
                    velocity: player.gameModel.velocity,
                    position: player.gameModel.position
                };
                setTimeout(that.unicast, player.delay, that.sockets[player.pid], message);
                
                break;
            }
        }
    }

    this.checkGoal = function() {
        if (that.ball.position.x <= Sockick.BALL_RADIUS * 2) {
            if (that.ball.position.y >= Sockick.HEIGHT / 2 - Sockick.GATE_WIDTH / 2 + Sockick.BALL_RADIUS && that.ball.position.y <= Sockick.HEIGHT / 2 + Sockick.GATE_WIDTH / 2 - Sockick.BALL_RADIUS) {
                console.log("Right goal!");
                that.rightScore ++;
                return 1;
            }
        } else if (that.ball.position.x >= Sockick.WIDTH - Sockick.BALL_RADIUS) {
            if (that.ball.position.y >= Sockick.HEIGHT / 2 - Sockick.GATE_WIDTH / 2 + Sockick.BALL_RADIUS && that.ball.position.y <= Sockick.HEIGHT / 2 + Sockick.GATE_WIDTH / 2 - Sockick.BALL_RADIUS) {
                console.log("Left goal!");
                that.leftScore ++;
                return 2;
            }
        }
        return 0;
    }

    this.checkRuneHit = function(player) {
        return player.gameModel.position.x + Sockick.PLAYER_RADIUS >= that.runePositionX - Sockick.RUNE_DIMENSION 
            && player.gameModel.position.x - Sockick.PLAYER_RADIUS <= that.runePositionX + Sockick.RUNE_DIMENSION
            && player.gameModel.position.y + Sockick.PLAYER_RADIUS >= that.runePositionY - Sockick.RUNE_DIMENSION
            && player.gameModel.position.y - Sockick.PLAYER_RADIUS <= that.runePositionY + Sockick.RUNE_DIMENSION
    }


    this.clearRuneEffect = function() {
        if (that.runeType == Sockick.RUNE_TYPE_HASTE) {
            that.speed[that.hitPlayer.pid] = Sockick.PLAYER_SPEED;
        } else if (that.runeType == Sockick.RUNE_TYPE_HEAVY) {
            that.hitPlayer.gameModel.density = Sockick.PLAYER_DENSITY;
        } else if (that.runeType == Sockick.RUNE_TYPE_REVERSE) {
            if (that.hitPlayer.pid % 2 == 0) {
                that.direction[1] = false;
                that.direction[3] = false;
            } else {
                that.direction[2] = false;
                that.direction[4] = false;
            }
        } else if (that.runeType == Sockick.RUNE_TYPE_FROZEN) {
            if (that.hitPlayer.pid % 2 == 0) {
                that.speed[1] = Sockick.PLAYER_SPEED;
                that.speed[3] = Sockick.PLAYER_SPEED;
            } else {
                that.speed[2] = Sockick.PLAYER_SPEED;
                that.speed[4] = Sockick.PLAYER_SPEED;
            }
        }
    }

    this.initialisePlayerPosition = function(nextPID) {
        switch (nextPID){
            case 1:{
                return {x: Sockick.WIDTH / 4, y: Sockick.HEIGHT / 4};
            }
            case 2:{
                return {x: 3 * Sockick.WIDTH / 4, y: Sockick.HEIGHT / 4};
            }
            case 3:{
                return {x: Sockick.WIDTH / 4, y: 3 * Sockick.HEIGHT / 4};
            }
            case 4:{
                return {x: 3 * Sockick.WIDTH / 4, y: 3 * Sockick.HEIGHT / 4};
            }
            default:{
                console.log("Error: invalid nextPID: " + nextPID + typeof(nextPID));
                return "invalid pid";
            }
        }
    }


    this.modelMoveLeft = function(player){
        if (that.direction[player.pid]) {
            that.moveRight(player);
        } else {
            that.moveLeft(player);
        }
    }

    this.moveLeft = function(player) {
        if (!that.isModelMovingLeft(player)) {
            player.gameModel.position = {
                x: player.gameModel.position.x - that.speed[player.pid] - player.gameModel.velocity.x, 
                y: player.gameModel.position.y};
        }
    }

    this.modelMoveRight = function(player){
        if (that.direction[player.pid]) {
            that.moveLeft(player);
        } else {
            that.moveRight(player);
        }
    }

    this.moveRight = function(player) {
        if (!that.isModelMovingRight(player)) {
            player.gameModel.position = {
                x: player.gameModel.position.x + that.speed[player.pid] - player.gameModel.velocity.x, 
                y: player.gameModel.position.y};
        }
    }

    this.modelMoveUp = function(player){
        if (that.direction[player.pid]) {
            that.moveDown(player);
        } else {
            that.moveUp(player);
        }
    }

    this.moveUp = function(player) {
        if (!that.isModelMovingUp(player)) {
            player.gameModel.position = {
                x: player.gameModel.position.x, 
                y: player.gameModel.position.y - that.speed[player.pid] - player.gameModel.velocity.y};
        }
    }

    this.modelMoveDown = function(player){
        if (that.direction[player.pid]) {
            that.moveUp(player);
        } else {
            that.moveDown(player);
        }
    }

    this.moveDown = function(player) {
        if (!that.isModelMovingDown(player)) {
            player.gameModel.position = {
                x: player.gameModel.position.x, 
                y: player.gameModel.position.y + that.speed[player.pid] - player.gameModel.velocity.y};
        }
    }

    this.modelStop = function(player){
        player.gameModel.position = {
                x: player.gameModel.position.x - player.gameModel.velocity.x, 
                y: player.gameModel.position.y - player.gameModel.velocity.y};
    }


    this.isModelMovingLeft = function(player){
        return player.gameModel.velocity.x == -that.speed[player.pid];
    }

    this.isModelMovingRight = function(player){
        return player.gameModel.velocity.x == that.speed[player.pid];
    }

    this.isModelMovingUp = function(player){
        return player.gameModel.velocity.y == -that.speed[player.pid];
    }

    this.isModelMovingDown = function(player){
        return player.gameModel.velocity.y == that.speed[player.pid];
    }

    this.getAllOtherPlayersOtherThan = function(playerID){
        
        var other_players = new Array();

        var socketID;
        var other_player;

        for (socketID in that.players) {
            other_player = that.players[socketID]; // socketID === player.sid
            if (other_player !== undefined && other_player.pid !== playerID){
                other_players.push(other_player);
            }
        }

        return other_players;
    }

    this.start = function() {
        that.initializeGameEngine();
    }
}

global.Session = Session;