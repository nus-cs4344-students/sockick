

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
        // Clears gameInterval and set it to undefined
        if (gameInterval !== undefined) {
            clearInterval(gameInterval);
            gameInterval = undefined;
        }
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
        var startPos;

        switch (nextPID){
            case 1:{
                startPos = {x: Sockick.WIDTH / 4, y: Sockick.HEIGHT / 4};
                break;
            }
            case 2:{
                startPos = {x: 3 * Sockick.WIDTH / 4, y: Sockick.HEIGHT / 4};
                break;
            }
            case 3:{
                startPos = {x: Sockick.WIDTH / 4, y: 3 * Sockick.HEIGHT / 4};
                break;
            }
            case 4:{
                startPos = {x: 3 * Sockick.WIDTH / 4, y: 3 * Sockick.HEIGHT / 4};
                break;
            }
            default:{
                console.log("Error: invalid nextPID: " + nextPID + typeof(nextPID));
            }
        }

        // Send message to new player (the current client)
        unicast(conn, {type: "message", content:"You are Player " + nextPID + ". Your position is at the " + initialPosition});

        // Create player object and insert into players with key = conn.id
        // @param: x, y, radius, options, maxSides
        var gameModel = Bodies.circle(startPos.x, startPos.y, Sockick.PLAYER_RADIUS, null, 25);
        gameModel.density = 0.01;
        gameModel.frictionAir = 0.05;
        gameModel.friction = 0.1;
        gameModel.restitution = 0.0;

        var player = new Player(conn.id, nextPID);
        player.gameModel = gameModel;

        World.addBody(engine.world, gameModel);

        players[conn.id] = player; // conn.id is a complex string
        sockets[nextPID] = conn; // nextPID is an integer

        console.log("Next pid: " + nextPID);
        
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

        var socketID;
        var player;

        for (socketID in players) {
            player = players[socketID]; // socketID === player.sid
            console.log("Updating player with playerID: " + socketID);
            if (player !== undefined) {
                var states = { 
                    type: "update",
                    timestamp: currentTime,
                    ball_position: {x: ball.position.x, y: ball.position.y},
                    player_positions: [{x: player.gameModel.position.x, y: player.gameModel.position.y}]    
                };

                //console.log("State: " + player.position.x + " " + player.position.y);
            
                setTimeout(unicast, 0, sockets[player.pid], states);

            } else{
                console.log("player is undefined now with ID: " + socketID);
            }
        }
        Engine.update(engine, 1000/Sockick.FRAME_RATE);
        // TODO: check win/lost conditions.
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
            // There is already a timer running so the game has 
            // already started.
            console.log("Already playing!");

        } else if (Object.keys(players).length % 2 !== 0) {
            // We need even number of players to play.
            console.log("Not enough players!");
            broadcast({type:"message", content:"Not enough player"});

        } else {
            // Everything is a OK
            console.log("Starting game...");
            gameInterval = setInterval(function() {gameLoop();}, 1000/Sockick.FRAME_RATE);
        }        
    }

    var initializeGameEngine = function () {
        // create a Matter.js engine
        var jsdom = require("jsdom").jsdom;
        var document = jsdom("hello world");

        engine = Engine.create(null, null);

        engine.world.gravity = { x: 0, y: 0 };

        var width = Sockick.WIDTH;
        var height = Sockick.HEIGHT;
        var wall_thickness = 500;
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
        switch (newDirection){
            case "left":{
                model_move_left(player.gameModel);
                break;
            }
            case "up":{
                model_move_up(player.gameModel);
                break;
            }
            case "right":{
                model_move_right(player.gameModel);
                break;
            }
            case "down":{
                model_move_down(player.gameModel);
                break;
            }
            case "stop":{
                model_stop(player.gameModel);
                break;
            }
        }
    }

    // ======== Player Move ==========
    var deltaDistance = 10;

    function model_move_left(model){
        if (!is_model_moving_left(model)) {
            model.position = {
                x: model.position.x - deltaDistance - model.velocity.x, 
                y: model.position.y};
        }
    }

    function model_move_right(model){
        if (!is_model_moving_right(model)) {
            model.position = {
                x: model.position.x + deltaDistance - model.velocity.x, 
                y: model.position.y};
        }
    }

    function model_move_up(model){
        if (!is_model_moving_up(model)) {
            model.position = {
                x: model.position.x, 
                y: model.position.y - deltaDistance - model.velocity.y};
        }
    }

    function model_move_down(model){
        if (!is_model_moving_down(model)) {
            model.position = {
                x: model.position.x, 
                y: model.position.y + deltaDistance - model.velocity.y};
        }
    }

    function model_stop(model){
        model.position = {
                x: model.position.x - model.velocity.x, 
                y: model.position.y - model.velocity.y};
    }

    // ==== Predicates ====

    function is_model_moving_left(model){
        return model.velocity.x == -deltaDistance;
    }

    function is_model_moving_right(model){
        return model.velocity.x == deltaDistance;
    }

    function is_model_moving_up(model){
        return model.velocity.y == -deltaDistance;
    }

    function is_model_moving_down(model){
        return model.velocity.y == deltaDistance;
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

            initializeGameEngine();

            // Upon connection established from a client socket
            sock.on('connection', function (conn) {
                
                console.log("connected");

                // Try to start game. If we have a even number of players, it'll start.
                startGame();

                // Sends to client
                broadcast({type:"message", content:"There is now " + count + " players"});

                if (count == 4) {
                    // Send back message that game is full
                    unicast(conn, {type:"message", content:"The game is full.  Come back later"});
                    // TODO: force a disconnect
                } else{
                    // create a new player. Count is added there.
                    newPlayer(conn); 
                }

                // When the client closes the connection to the server/closes the window
                conn.on('close', function () {
                    // Stop game if it's playing
                    reset();

                    // Decrease player counter
                    count--;

                    // Set nextPID to quitting player's PID
                    nextPID = players[conn.id].pid; 

                    console.log("Player did quit: " + nextPID);

                    // Remove player who wants to quit/closed the window
                    if (players[conn.id] === p1) p1 = undefined;
                    if (players[conn.id] === p2) p2 = undefined;
                    if (players[conn.id] === p3) p3 = undefined;                    
                    if (players[conn.id] === p4) p4 = undefined;

                    delete players[conn.id];

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
                        // one of the player starts the game.
                        case "start": 
                            console.log("server start");
                            startGame();
                            break;
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
}

// This will auto run after this script is loaded
var gameServer = new SockickServer();
gameServer.start();

// vim:ts=4:sw=4:expandtab
