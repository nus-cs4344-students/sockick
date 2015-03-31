

// enforce strict/clean programming
"use strict"; 

var LIB_PATH = "./../";

require(LIB_PATH + "Sockick.js");
require(LIB_PATH + "node_modules/matter-js/build/matter-0.8.0.js");

function SockickServer() {
    // Private Variables
    var port;         // Game port 
    var count;        // Keeps track how many people are connected to server 
    var nextPID;      // PID to assign to next connected player (i.e. which player slot is open) 
    var ball;         // the game ball 
    var sockets;      // Associative array for sockets, indexed via player ID
    var players;      // Associative array for players, indexed via socket ID
    var p1, p2, p3, p4;       // Players

    var Engine = Matter.Engine;
    var World = Matter.World;
    var Bodies = Matter.Bodies;

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

        // 1st player is always top, 2nd player is always bottom
        var initialPosition = (nextPID === 1) ? "left" : "right";
        var startPos = (nextPID === 1) ? 
                        {x: Sockick.WIDTH / 4, y: Sockick.HEIGHT / 2} : 
                        {x: 3 * Sockick.WIDTH / 4, y: Sockick.HEIGHT / 2};

        // Send message to new player (the current client)
        unicast(conn, {type: "message", content:"You are Player " + nextPID + ". Your position is at the " + initialPosition});

        // Create player object and insert into players with key = conn.id
        players[conn.id] = Bodies.rectangle(startPos.x, startPos.y, 80, 80);;
        sockets[nextPID] = conn;

        // Mark as player 1 or 2
        if (nextPID == 1) {
            p1 = players[conn.id];
        } else if (nextPID == 2) {
            p2 = players[conn.id];
        } else if (nextPID == 3){
            p3 = players[conn.id];
        } else if (nextPID == 4){
            p4 = players[conn.id];
        }

        // Updates the nextPID to issue (flip-flop between 1 and 2)
        nextPID = ((nextPID + 1) % 2 === 0) ? 2 : 1;
    }

    /*
     * private method: gameLoop()
     *
     * The main game loop.  Called every interval at a
     * period roughly corresponding to the frame rate 
     * of the game
     */
    var gameLoop = function () {
        // Check if ball is moving
        if (ball.isMoving()) {

            // Move paddle (in case accelerometer is used and vx is non-zero).
            p1.paddle.moveOneStep();
            p2.paddle.moveOneStep();

            // Move ball
            ball.updatePosition();
            ball.checkForBounce(p1.paddle, p2.paddle);

            // Update on player side
            var bx = ball.x;
            var by = ball.y;
            var date = new Date();
            var currentTime = date.getTime();
            var states = { 
                type: "update",
                timestamp: currentTime,
                ballX: bx,
                ballY: by,
                myPaddleX: p1.paddle.x,
                myPaddleY: p1.paddle.y,
                opponentPaddleX: p2.paddle.x,
                opponentPaddleY: p2.paddle.y};
            setTimeout(unicast, p1.getDelay(), sockets[1], states);
            states = { 
                type: "update",
                timestamp: currentTime,
                ballX: bx,
                ballY: by,
                myPaddleX: p2.paddle.x,
                myPaddleY: p2.paddle.y,
         
                opponentPaddleX: p1.paddle.x,
                opponentPaddleY: p1.paddle.y};
            setTimeout(unicast, p2.getDelay(), sockets[2], states);
            if (ball.velocityUpdated) {
                var states = {
                    type: "updateVelocity",
                    timestamp: currentTime,
                    ballX: ball.x,
                    ballY: ball.y,
                    ballVX: ball.vx,
                    ballVY: ball.vy
                };


                setTimeout(unicast, p1.getDelay(), sockets[1], states);
                setTimeout(unicast, p2.getDelay(), sockets[2], states);
                ball.velocityUpdated = false;
            }
            if (ball.outOfBound) {
                states = { 
                    type: "outOfBound",
                    timestamp: currentTime,
                    };
                setTimeout(unicast, p1.getDelay(), sockets[1], states);
                setTimeout(unicast, p2.getDelay(), sockets[2], states);
                ball.outOfBound = false;
            }
        } else {
            // Reset
            reset();
        }
    }

    var calculateBallSpeed = function(delay, currentTime) {
        var distance = Sockick.HEIGHT - 2*Paddle.HEIGHT - Ball.HEIGHT;
        console.log(distance);
        var t0 = Math.abs(distance/ball.vy/Sockick.FRAME_RATE);
        var t = t0 - delay/1000;
        console.log(t0 + " "+ ball.vx+" "+ball.vy );
       
        var vy1;
        if (ball.vy<0)
            vy1 =  0-(distance/t/Sockick.FRAME_RATE);
        else
            vy1 = distance/t/Sockick.FRAME_RATE;
        var vx1 = vy1*ball.vx/ball.vy;
        console.log(t + " "+ vx1+" "+vy1 );

        var states = {
            type: "updateVelocity",
            timestamp: currentTime,
            ballX: ball.x,
            ballY: ball.y,
            ballVX: vx1,
            ballVY: vy1
        };

        return states;
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

        } else if (Object.keys(players).length < 2) {
            // We need two players to play.
            console.log("Not enough players!");
            broadcast({type:"message", content:"Not enough player"});

        } else {
            // Everything is a OK
            ball.startMoving();
            gameInterval = setInterval(function() {gameLoop();}, 1000/Sockick.FRAME_RATE);
        }
    }

    var initializeGameEngine = function () {
        // Matter.js module aliases

        // create a Matter.js engine
        var engine = Engine.create(document.body);
        
        engine.world.gravity = { x: 0, y: 0 };

        var width = 400;
        var height = 400;
        var wall_thickness = 50;
        var options =  { isStatic: true };

        var wall_top = Bodies.rectangle(
            wall_thickness, 
            0,
            width * 2, 
            wall_thickness, 
            options
        );

        var wall_bottom = Bodies.rectangle(
            wall_thickness, 
            height + wall_thickness, 
            width * 2, 
            wall_thickness, 
            options
        );

        var wall_left = Bodies.rectangle(
            0, 
            wall_thickness, 
            wall_thickness, 
            height * 2, 
            options
        );

        var wall_right = Bodies.rectangle(
            width + wall_thickness, 
            wall_thickness,
            wall_thickness, 
            height * 2, 
            options
        );

        var ball = Bodies.circle(200, 100, 25, 25);

        boxA.frictionAir = 0.0;
        boxA.friction = 0.0;
        ball.friction = 0.5;
    }

    /*
     * priviledge method: start()
     *
     * Called when the server starts running.  Open the
     * socket and listen for connections.  Also initialize
     * callbacks for socket.
     */
    this.start = function () {
        try {
            var express = require('express');
            var http = require('http');
            var sockjs = require('sockjs');
            var sock = sockjs.createServer();

            // reinitialize 
            count = 0;
            nextPID = 1;
            gameInterval = undefined;
            ball = new Ball();
            players = new Object;
            sockets = new Object;


            
            // Upon connection established from a client socket
            sock.on('connection', function (conn) {
                console.log("connected");
                // Sends to client
                broadcast({type:"message", content:"There is now " + count + " players"});

                if (count == 2) {
                    // Send back message that game is full
                    unicast(conn, {type:"message", content:"The game is full.  Come back later"});
                    // TODO: force a disconnect
                } else {
                    // create a new player
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

                    // Remove player who wants to quit/closed the window
                    if (players[conn.id] === p1) p1 = undefined;
                    if (players[conn.id] === p2) p2 = undefined;
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

                        // one of the player moves the mouse.
                        case "move":
                            setTimeout(movePaddle, p.getDelay(), conn.id, message.x, message.timestamp);
                            break;
                            
                        // one of the player moves the mouse.
                        case "accelerate":
                            setTimeout(acceleratePaddle, p.getDelay(), conn.id, message.vx, message.timestamp);
                            break;

                        // one of the player change the delay
                        case "delay":
                            players[conn.id].delay = message.delay;
                            break;

                        case "outOfBound":
                            ball.reset();
                            ball.outOfBound = false;
                            // p1.paddle.reset();
                            // p2.paddle.reset();
                            //reset();
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
            sock.installHandlers(httpServer, {prefix:'/Sockick'});
            httpServer.listen(Sockick.PORT, '0.0.0.0');
            app.use(express.static(__dirname));
            console.log("Server running on http://0.0.0.0:" + Sockick.PORT + "\n")
            console.log("Visit http://0.0.0.0:" + Sockick.PORT + "/Sockick.html in your " + 
                        "browser to start the game")
        } catch (e) {
            console.log("Cannot listen to " + Sockick.PORT);
            console.log("Error: " + e);
        }
    }
}

// This will auto run after this script is loaded
var gameServer = new SockickServer();
gameServer.start();

// vim:ts=4:sw=4:expandtab
