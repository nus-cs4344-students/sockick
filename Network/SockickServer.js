

// enforce strict/clean programming
"use strict"; 

var LIB_PATH = "./../";

require(LIB_PATH + "Sockick.js");
require(LIB_PATH + "Model/Player.js");
require(LIB_PATH + "Lib/matter-0.8.0-modified.js");
//require('matter-js');

function SockickServer() {
    // Private Variables
    var port;         // Game port 
    var count;        // Keeps track how many people are connected to server 
    var nextPID;      // PID to assign to next connected player (i.e. which player slot is open) 
    var gameInterval; // Interval variable used for gameLoop 
    var sockets;      // Associative array for sockets, indexed via player ID, an integer
    var players;      // Associative array for players, indexed via socket ID, a complexed string
    var p1, p2, p3, p4;       // Players
    var ball;         // the game football 

    var Engine = Matter.Engine;
    var World = Matter.World;
    var Bodies = Matter.Bodies;
    var engine;
    var leftScore = 0;
    var rightScore = 0;
    var gameTicksLeft = Sockick.GAME_DURATION * Sockick.FRAME_RATE;
    var runeType;
    var runePositionX;
    var runePositionY;
    var hit = false;
    var hitPlayer;
    var speed;
    var runeEffectEndTick = Sockick.GAME_DURATION * Sockick.FRAME_RATE;
    var hasRune = false;
    var direction;

    var lastBallSpeed;

    /*
     * private method: broadcast(msg)
     *
     * broadcast takes in a JSON structure and send it to
     * all players.
     *
     * e.g., broadcast({type: "abc", x: 30});
     */
    var broadcast = function (msg) {
        var id;
        for (id in sockets) {
            sockets[id].write(JSON.stringify(msg));
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
    var unicast = function (socket, msg) {
        socket.write(JSON.stringify(msg));
    }

    /*
     * private method: reset()
     *
     * Reset the game to its initial state.  Clean up
     * any remaining timers.  Usually called when the
     * connection of a player is closed.
     */
    var reset = function () {
        if (gameInterval !== undefined) {
            clearInterval(gameInterval);
            gameInterval = undefined;
            
        }
    }
    var reStart = function() {
        reset();
        var leftScore = 0;
        var rightScore = 0;
        var gameTicksLeft = Sockick.GAME_DURATION * Sockick.FRAME_RATE;
    }

    /*
     * private method: newPlayer()
     *
     * Called when a new connection is detected.  
     * Create and init the new player.
     */
    var newPlayer = function (conn) {
        
        count ++;

        var initialPosition = (nextPID % 2 === 1) ? "left" : "right";
        var startPos = initialise_player_position(nextPID);

        // Send message to new player (the current client)
        unicast(conn, {type: "message", content:"You are Player " + nextPID + ". Your position is at the " + initialPosition});

        var newPlayer = new Player(conn.id, nextPID);
        var gameModel = createGameModelForNewPlayer(startPos);
        newPlayer.gameModel = gameModel;
        World.addBody(engine.world, gameModel);

        players[conn.id] = newPlayer; // conn.id is a complex string
        sockets[nextPID] = conn; // nextPID is an integer
        speed[nextPID] = Sockick.PLAYER_SPEED;

        console.log("A new player joined with pid: " + nextPID);

        // Update the players with the new player:
        var others = getAllOtherPlayersOtherThan(newPlayer.pid);

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
            var new_other_player = others[i];
            setTimeout(unicast, 0, sockets[new_other_player.pid], states);
            console.log("New user added. Sending " + states.is_self + " to pid: " + new_other_player.pid);
        }

        states = JSON.parse(statesJSON);
        states.is_self = true;
        setTimeout(unicast, 0, sockets[newPlayer.pid], states);
        console.log("New user added. Sending " + states.is_self + " to pid: " + newPlayer.pid);

        // Mark as player 1 to 4
        if (nextPID == 1) {
            p1 = players[conn.id];
            nextPID = 2;
        } else if (nextPID == 2) {
            p2 = players[conn.id];
            nextPID = 3;
        } else if (nextPID == 3){
            p3 = players[conn.id];
            nextPID = 4;
        } else if (nextPID == 4){
            p4 = players[conn.id];
            nextPID = 1;
        }
    }

    var createGameModelForNewPlayer = function (startPos){
        // Create player object and insert into players with key = conn.id
        // @param: x, y, radius, options, maxSides
        var gameModel = Bodies.circle(startPos.x, startPos.y, Sockick.PLAYER_RADIUS, null, 25);
        gameModel.density = Sockick.PLAYER_DENSITY;
        gameModel.frictionAir = Sockick.PLAYER_FRICTION_AIR;
        gameModel.friction = Sockick.PLAYER_FRICTION;
        gameModel.restitution = 0.0;

        return gameModel;
    }

    var computeTimeLeft = function() {
        var minLeft = Math.floor(Math.floor(gameTicksLeft / Sockick.FRAME_RATE) / 60);
        var secLeft = Math.floor(gameTicksLeft / Sockick.FRAME_RATE) % 60;
        return minLeft + ":" + secLeft;
    }

    /*
     * private method: gameLoop()
     *
     * The main game loop.  Called every interval at a
     * period roughly corresponding to the frame rate 
     * of the game
     */
    var gameLoop = function () {
        // Update on player side
        
        var date = new Date();
        var currentTime = date.getTime();
        gameTicksLeft --;
        var timeLeft = computeTimeLeft();
        var socketID;
        var player;
        var goal_status = check_goal();
        if (goal_status != 0) {
            reset();
            console.log("Goal status is " + goal_status);
            Matter.Composite.clear(engine.world, false, true);
            initializeGameEngine();
            // Add players:
            for (socketID in players) {
                player = players[socketID]; // socketID === player.sid
                if (player !== undefined){
                    var startPos = initialise_player_position(player.pid);
                    var gameModel = createGameModelForNewPlayer(startPos);
                    player.gameModel = gameModel;
                    World.addBody(engine.world, gameModel);
                    console.log("New position: " + player.gameModel.position.x + ", " + player.gameModel.position.y);
                }
            }
            startGame();
        }
        if (gameTicksLeft == runeEffectEndTick) {
            clearRuneEffect();
        }

        // Consturct the message:
        var position_updates = new Array();
        for (socketID in players) {
            player = players[socketID]; // socketID === player.sid
            if (player !== undefined){
                position_updates.push({
                    pid: player.pid,
                    position: {
                        x: player.gameModel.position.x, 
                        y: player.gameModel.position.y
                    }
                });
                if (hasRune) {
                    hit = checkRuneHit(player);
                    if (hit) {
                        hitPlayer = player;
                        hasRune = false;
                        console.log("Hit by " + hitPlayer.pid);
                        runeEffectEndTick = gameTicksLeft - Sockick.RUNE_EFFECT_DURATION * Sockick.FRAME_RATE;
                        if (runeType == Sockick.RUNE_TYPE_HASTE) {
                            speed[player.pid] = Sockick.PLAYER_SPEED * 2;
                        } else if (runeType == Sockick.RUNE_TYPE_HEAVY) {
                            hitPlayer.gameModel.density = Sockick.PLAYER_DENSITY * 2;
                        } else if (runeType == Sockick.RUNE_TYPE_REVERSE) {
                            if (hitPlayer.pid % 2 == 0) {
                                direction[1] = true;
                                direction[3] = true;
                            } else {
                                direction[2] = true;
                                direction[4] = true;
                            }
                        } else if (runeType == Sockick.RUNE_TYPE_FROZEN) {
                            if (hitPlayer.pid % 2 == 0) {
                                speed[1] = 0;
                                speed[3] = 0;
                            } else {
                                speed[2] = 0;
                                speed[4] = 0;
                            }
                        }
                    }
                }
            }
        }

        if (!hasRune && gameTicksLeft < runeEffectEndTick) {
            var r = Math.floor((Math.random() * Sockick.AVERAGE_RUNE_GENERATION_TIME * Sockick.FRAME_RATE) + 1);
            if (r == 1) {
                hasRune = true;
                // runeType = Math.floor(Math.random() * 3);
                runeType = 3;
                runePositionX = Math.floor(Math.random() * Sockick.WIDTH);
                runePositionY = Math.floor(Math.random() * Sockick.HEIGHT);
            }
        }
        

        //var goal_status = check_goal();

        for (socketID in players) {
            player = players[socketID]; // socketID === player.sid
            
            //console.log("Updating player with playerID: " + socketID);
            
            if (player !== undefined) {
                if (goal_status == 0) {
                    if (gameTicksLeft == 0) {
                        var states = { 
                            type: "end",
                            timestamp: currentTime,
                            leftscore: leftScore,
                            rightscore: rightScore
                        };
                        //console.log("State: " + player.position.x + " " + player.position.y);
                        setTimeout(unicast, 0, sockets[player.pid], states);
                        reStart();
                    } else {
                        if (r == 1) {
                            var runeMessage = {
                                type: "rune_create",
                                timestamp: currentTime,
                                runetype: runeType,
                                x: runePositionX,
                                y: runePositionY
                            };
                            setTimeout(unicast, 0, sockets[player.pid], runeMessage);
                        }
                        if (hit) {
                            var runeHitMessage = {
                                type: "rune_hit",
                                timestamp: currentTime,
                                runetype: runeType,
                                playerid: hitPlayer.pid
                            };
                            setTimeout(unicast, 0, sockets[player.pid], runeHitMessage);
                        }
                        var states = { 
                            type: "update_players",
                            timestamp: currentTime,
                            timeleft: timeLeft,
                            player_positions: position_updates
                        };

                        //console.log("State: " + player.position.x + " " + player.position.y);
                        setTimeout(unicast, 0, sockets[player.pid], states);                        
                    }
                    
                } else {
                    var states = { 
                        type: "goal",
                        timestamp: currentTime,
                        leftscore: leftScore,
                        rightscore: rightScore
                    };
                    setTimeout(unicast, 0, sockets[player.pid], states);
                }
            } else{
                console.log("player is undefined now with ID: " + socketID);
            }
        }
        hit = false;

        // If the velocity of the ball is changed, tell players:
        if (Math.abs(ball.speed - lastBallSpeed) > 0.01) {
            var ballPosition = { 
                type: "update_ball",
                timestamp: currentTime,
                ball_position: {x: ball.position.x, y: ball.position.y},
                ball_velocity: {x: ball.velocity.x, y: ball.velocity.y},
            }
            broadcast(ballPosition);
            console.log("Update ball position.");
        }
        lastBallSpeed = ball.speed;

        Engine.update(engine, 1000/Sockick.FRAME_RATE);
    }

    /*
     * private method: startGame()
     *
     * Start a new game.  Check if we have at least two 
     * players and a game is not already running.
     * If everything is OK, get the ball moving and start
     * the game loop.
     */
    var startGame = function () {

        if (gameInterval !== undefined) {
            console.log("Game already playing!");
        } else if (count === 1) { // Used to be: Object.keys(players).length, breaks abstraction.
            // We need even number of players to play.
            console.log("Not enough players!");
            broadcast({type:"message", content:"Not enough player"});
        } else {
            // Everything is a OK
            console.log("Starting game...");
            gameInterval = setInterval(function() {gameLoop();}, 1000/Sockick.FRAME_RATE);
        }

        console.log("In startGame(), player count: " + count);     
    }

    var initializeGameEngine = function () {

        engine = Engine.create(null, null);

        engine.world.gravity = { x: 0, y: 0 };

        var width = Sockick.WIDTH;
        var height = Sockick.HEIGHT;
        var wall_thickness = 1000;
        var options =  { isStatic: true,};

        var wall_top = Bodies.rectangle(
            width / 2, 
            -wall_thickness / 2,
            width + wall_thickness * 2, 
            wall_thickness, 
            options
        );

        var wall_bottom = Bodies.rectangle(
            width / 2, 
            height + wall_thickness / 2, 
            width + 2 * wall_thickness, 
            wall_thickness, 
            options
        );

        var wall_left = Bodies.rectangle(
            - wall_thickness / 2, 
            height / 2, 
            wall_thickness, 
            height, 
            options
        );

        var wall_right = Bodies.rectangle(
            width + wall_thickness / 2, 
            height / 2, 
            wall_thickness, 
            height, 
            options
        );

        wall_top.restitution = 1;
        wall_bottom.restitution = 1;
        wall_left.restitution = 1;
        wall_right.restitution = 1;

        ball = Bodies.circle(Sockick.WIDTH / 2, Sockick.HEIGHT / 2, Sockick.BALL_RADIUS, null, 25);
        ball.frictionAir = 0.0;
        ball.friction = 0.01;
        ball.restitution = 1;

        World.addBody(engine.world, ball);
                
        World.addBody(engine.world, wall_top);
        World.addBody(engine.world, wall_bottom);
        World.addBody(engine.world, wall_right);
        World.addBody(engine.world, wall_left);

    }

    function player_change_direction(player, newDirection){
        console.log(newDirection);
        player.gameModel.frictionAir = 0.00;
        player.gameModel.friction = 0.00;
        switch (newDirection){
            case "left":{
                model_move_left(player);
                break;
            }
            case "up":{
                model_move_up(player);
                break;
            }
            case "right":{
                model_move_right(player);
                break;
            }
            case "down":{
                model_move_down(player);
                break;
            }
            case "up_right":{
                model_move_up(player);
                model_move_right(player);
                break;
            }
            case "up_left":{
                model_move_up(player);
                model_move_left(player);
                break;
            }
            case "down_right":{
                model_move_down(player);
                model_move_right(player);

                break;
            }
            case "down_left":{
                model_move_down(player);
                model_move_left(player);
                break;
            }
            case "stop":{
                player.gameModel.friction = Sockick.PLAYER_FRICTION;
                player.gameModel.frictionAir = Sockick.PLAYER_FRICTION_AIR;
                model_stop(player);
                break;
            }
        }
    }

    function check_goal() {
        if (ball.position.x <= Sockick.BALL_RADIUS * 2) {
            if (ball.position.y >= Sockick.HEIGHT / 2 - Sockick.GATE_WIDTH / 2 + Sockick.BALL_RADIUS && ball.position.y <= Sockick.HEIGHT / 2 + Sockick.GATE_WIDTH / 2 - Sockick.BALL_RADIUS) {
                console.log("Right goal!");
                rightScore ++;
                return 1;
            }
        } else if (ball.position.x >= Sockick.WIDTH - Sockick.BALL_RADIUS) {
            if (ball.position.y >= Sockick.HEIGHT / 2 - Sockick.GATE_WIDTH / 2 + Sockick.BALL_RADIUS && ball.position.y <= Sockick.HEIGHT / 2 + Sockick.GATE_WIDTH / 2 - Sockick.BALL_RADIUS) {
                console.log("Left goal!");
                leftScore ++;
                return 2;
            }
        }
        return 0;
    }

    function checkRuneHit(player) {
        return player.gameModel.position.x + Sockick.PLAYER_RADIUS >= runePositionX - Sockick.RUNE_DIMENSION 
            && player.gameModel.position.x - Sockick.PLAYER_RADIUS <= runePositionX + Sockick.RUNE_DIMENSION
            && player.gameModel.position.y + Sockick.PLAYER_RADIUS >= runePositionY - Sockick.RUNE_DIMENSION
            && player.gameModel.position.y - Sockick.PLAYER_RADIUS <= runePositionY + Sockick.RUNE_DIMENSION
    }

    function clearRuneEffect() {
        if (runeType == Sockick.RUNE_TYPE_HASTE) {
            speed[hitPlayer.pid] = Sockick.PLAYER_SPEED;
        } else if (runeType == Sockick.RUNE_TYPE_HEAVY) {
            hitPlayer.gameModel.density = Sockick.PLAYER_DENSITY;
        } else if (runeType == Sockick.RUNE_TYPE_REVERSE) {
            if (hitPlayer.pid % 2 == 0) {
                direction[1] = false;
                direction[3] = false;
            } else {
                direction[2] = false;
                direction[4] = false;
            }
        } else if (runeType == Sockick.RUNE_TYPE_FROZEN) {
            if (hitPlayer.pid % 2 == 0) {
                speed[1] = Sockick.PLAYER_SPEED;
                speed[3] = Sockick.PLAYER_SPEED;
            } else {
                speed[2] = Sockick.PLAYER_SPEED;
                speed[4] = Sockick.PLAYER_SPEED;
            }
        }
    }

    function initialise_player_position(nextPID) {
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

    // ======== Player Move ==========
    var deltaDistance = 10;

    function model_move_left(player){
        if (direction[player.pid]) {
            moveRight(player);
        } else {
            moveLeft(player);
        }
    }
    function moveLeft(player) {
        if (!is_model_moving_left(player)) {
            player.gameModel.position = {
                x: player.gameModel.position.x - speed[player.pid] - player.gameModel.velocity.x, 
                y: player.gameModel.position.y};
        }
    }

    function model_move_right(player){
        if (direction[player.pid]) {
            moveLeft(player);
        } else {
            moveRight(player);
        }
    }

    function moveRight(player) {
        if (!is_model_moving_right(player)) {
            player.gameModel.position = {
                x: player.gameModel.position.x + speed[player.pid] - player.gameModel.velocity.x, 
                y: player.gameModel.position.y};
        }
    }

    function model_move_up(player){
        if (direction[player.pid]) {
            moveDown(player);
        } else {
            moveUp(player);
        }
    }

    function moveUp(player) {
        if (!is_model_moving_up(player)) {
            player.gameModel.position = {
                x: player.gameModel.position.x, 
                y: player.gameModel.position.y - speed[player.pid] - player.gameModel.velocity.y};
        }
    }

    function model_move_down(player){
        if (direction[player.pid]) {
            moveUp(player);
        } else {
            moveDown(player);
        }
    }

    function moveDown(player) {
        if (!is_model_moving_down(player)) {
            player.gameModel.position = {
                x: player.gameModel.position.x, 
                y: player.gameModel.position.y + speed[player.pid] - player.gameModel.velocity.y};
        }
    }

    function model_stop(player){
        player.gameModel.position = {
                x: player.gameModel.position.x - player.gameModel.velocity.x, 
                y: player.gameModel.position.y - player.gameModel.velocity.y};
    }

    // ==== Predicates ====

    function is_model_moving_left(player){
        return player.gameModel.velocity.x == -speed[player.pid];
    }

    function is_model_moving_right(player){
        return player.gameModel.velocity.x == speed[player.pid];
    }

    function is_model_moving_up(player){
        return player.gameModel.velocity.y == -speed[player.pid];
    }

    function is_model_moving_down(player){
        return player.gameModel.velocity.y == speed[player.pid];
    }

    /*
     * priviledge method: start()
     *
     * Called when the server starts running.  Open the
     * socket and listen for connections.  Also initialize
     * callbacks for socket.
     */
    this.start = function () {
        //try {

            var express = require('express');
            var http = require('http');
            var sockjs = require('sockjs');
            var sock = sockjs.createServer();

            // reinitialize 
            count = 0;
            nextPID = 1;
            gameInterval = undefined;
            players = new Object;
            sockets = new Object;
            speed = new Object;
            direction= new Object;

            initializeGameEngine();

            // Upon connection established from a client socket
            sock.on('connection', function (conn) {
                
                console.log("connected");

                // Sends to client
                broadcast({type:"message", content:"There is now " + count + " players"});

                if (count == 4) {
                    // Send back message that game is full
                    unicast(conn, {type:"message", content:"The game is full.  Come back later"});
                    // Force a disconnect
                    conn.close();
                } else{
                    // create a new player. Count is added there.
                    newPlayer(conn);
                }

                // Try to start game. If we have a even number of players, it'll start.
                startGame();

                // When the client closes the connection to the server/closes the window
                conn.on('close', function () {

                    // Decrease player counter
                    count--;

                    console.log("Player did quit with conn.id: " + conn.id + " and current nextPID: " + nextPID);
                    // Set nextPID to quitting player's PID
                    nextPID = players[conn.id].pid;

                    console.log("Player did quit. New nextPID: " + nextPID);

                    // Update players:
                    broadcast({type: "delete_player", pid: players[conn.id].pid});

                    // Remove gameModel from engine:
                    Matter.Composite.removeBody(engine.world, players[conn.id].gameModel);

                    // Remove player who wants to quit/closed the window
                    if (players[conn.id] === p1) p1 = undefined;
                    if (players[conn.id] === p2) p2 = undefined;
                    if (players[conn.id] === p3) p3 = undefined;                    
                    if (players[conn.id] === p4) p4 = undefined;

                    delete players[conn.id];

                    // Stop game if too little players are playing
                    if (count < 1) {
                        reset();
                    }

                    // Sends to everyone connected to server except the client
                    broadcast({type:"message", content: " There is now " + count + " players."});
                });

                // When the client send something to the server.
                conn.on('data', function (data) {
                    var message = JSON.parse(data)
                    var p = players[conn.id]

                    if (p === undefined) {
                        // we received data from a connection with
                        // no corresponding player.  don't do anything.
                        return;
                    } 

                    switch (message.type) {
                        case "direction_changed":
                            player_change_direction(players[conn.id], message.new_direction);
                            break;
                        default:
                            console.log("Unhandled " + message.type);
                    }
                }); // conn.on("data"
            }); // socket.on("connection"

            // Standard code to starts the Sockick server and listen
            // for connection
            var app = express();
            var httpServer = http.createServer(app);
            sock.installHandlers(httpServer, {prefix:'/sockick'});
            httpServer.listen(Sockick.PORT, '0.0.0.0');
            var dir = __dirname.substring(0, __dirname.length-8);
            console.log(dir);
            app.use(express.static(dir)); // __dirname

            console.log("Server running on http://0.0.0.0:" + Sockick.PORT + "\n")
            console.log("Visit http://0.0.0.0:" + Sockick.PORT + "/Sockick.html in your " + 
                        "browser to start the game")
        // } catch (e) {
        //     console.log("Cannot listen to " + Sockick.PORT);
        //     console.log("Error: " + e);
        // }
    }

    var getAllOtherPlayersOtherThan = function(playerID){
        
        var other_players = new Array();

        var socketID;
        var other_player;

        for (socketID in players) {
            other_player = players[socketID]; // socketID === player.sid
            if (other_player !== undefined && other_player.pid !== playerID){
                other_players.push(other_player);
            }
        }

        return other_players;
    }
}

// This will auto run after this script is loaded
var gameServer = new SockickServer();
gameServer.start();

// vim:ts=4:sw=4:expandtab
