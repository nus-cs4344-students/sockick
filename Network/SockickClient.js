// enforce strict/clean programming
"use strict";

function SockickClient() {
    // private variables
    var socket; // socket used to connect to server 
    var playArea; // HTML5 canvas game window 
    var ball; // ball object in game 

    var lastUpdateAt = 0; // timestamp of last recv update


    // player list
    var players = {};
    var myPid;

    /*
     * private method: sendToServer(msg)
     *
     * The method takes in a JSON structure and send it
     * to the server, after converting the structure into
     * a string.
     */
    var sendToServer = function(msg) {
        var date = new Date();
        var currentTime = date.getTime();
        msg["timestamp"] = currentTime;
        socket.send(JSON.stringify(msg));
    }

    /*
     * private method: initNetwork(msg)
     *
     * Connects to the server and initialize the various
     * callbacks.
     */
    var initNetwork = function() {
        // Attempts to connect to game server
        //try {
        socket = new SockJS("http://" + Sockick.SERVER_NAME + ":" + Sockick.PORT + "/sockick");
        socket.onmessage = function(e) {
                var message = JSON.parse(e.data);
                console.log(message);
                switch (message.type) {
                    case "update":
                        var t = message.timestamp;
                        if (t < lastUpdateAt)
                            break;
                        lastUpdateAt = t;
                        
                        // update ball
                        ball.x = message.ball_position.x;
                        ball.y = message.ball_position.y;

                        // update players
                        var positions = message.player_positions;
                        var id;
                        for (id in positions) {
                            if (players[positions[id].pid] === undefined)
                                continue;

                            var p = positions[id];
                            players[p.pid].x = p.position.x;
                            players[p.pid].y = p.position.y;
                        }

                        render();
                        break;
                    case "add_player":

                        //if player exits
                        if (players[message.pid] !== undefined)
                            break;
                        if (message.is_self) {
                            myPid = message.pid;

                            // add other players information
                            var others = message.other_players;
                            var id;
                            for (id in others) {
                                var player = new Player();
                                player.pid = others[id];
                                player.x = others[id].position.x;
                                player.y = others[id].position.y;
                                players[player.pid] = player;
                                renderer.createPlayer(player.pid, false);
                            }
                        }

                        //add myself
                        renderer.createPlayer(message.pid, message.is_self);
                        var player = new Player();
                        player.pid = message.pid;
                        player.x = message.position.x;
                        player.y = message.position.y;
                        players[player.pid] = player;

                    case "delete_player":
                        renderer.deletePlayer(message.pid);
                        players[message.pid] = undefined;
                        break;
                    default:
                        //appendMessage("serverMsg", "unhandled meesage type " + message.type);
                }
            }
            // } catch (e) {
            //     console.log("Failed to connect to " + "http://" + Sockick.SERVER_NAME + ":" + Sockick.PORT);
            // }
    }

    /*
     * private method: initGUI
     *
     * Initialize a play area and add events.
     */
    var initGUI = function() {

        while (document.readyState !== "complete") {
            console.log("loading...");
        };
        document.onkeydown = function(evt) {
            onKeyPress(evt);
        }

        document.onkeyup = function(evt) {
            onTouchEnd(evt);
        }


        //TBD

    }

    /*
     * private method: onTouchEnd
     *
     * Touch version of "mouse click" callback above.
     */
    var onTouchEnd = function(e) {
        if (e.keyCode >= 37 && e.keyCode <= 40) {
            sendToServer({
                type: "direction_changed",
                new_direction: "stop"
            });
        };

    }



    var onKeyPress = function(e) {
        /*
        keyCode represents keyboard button
        38: up arrow
        40: down arrow
        37: left arrow
        39: right arrow
        */
        switch (e.keyCode) {
            case 37:
                { // Left
                    sendToServer({
                        type: "direction_changed",
                        new_direction: "left"
                    });
                    e.preventDefault();
                    break;
                }
            case 38:
                { // Up
                    sendToServer({
                        type: "direction_changed",
                        new_direction: "up"
                    });
                    e.preventDefault();
                    break;
                }

            case 39:
                { // Right
                    sendToServer({
                        type: "direction_changed",
                        new_direction: "right"
                    });
                    e.preventDefault();
                    break;
                }
            case 40:
                { // Down
                    sendToServer({
                        type: "direction_changed",
                        new_direction: "down"
                    });
                    e.preventDefault();
                    break;
                }
        }
    }


    /*
     * private method: render
     *
     * Draw the play area.  Called periodically at a rate
     * equals to the frame rate.
     */
    var render = function() {
        //TBD
        var id;
        for (id in players) {
            if (players[id] == undefined)
                continue;
            renderer.updatePlayers(players[id].pid, players[id].x, players[id].y);
        }
        // renderer.updatePlayers(player1.pid, player1.x, player1.y);
        renderer.updateBall(ball.x, ball.y);
    }

    /*
     * priviledge method: start
     *
     * Create the ball and paddles objects, connects to
     * server, draws the GUI, and starts the rendering
     * loop.
     */
    this.start = function() {
        // Initialize game objects
        ball = new Ball();
        // player1 = new Player();
        // player1.pid = 1;
        renderer.init();
        // renderer.createPlayer(1, true);
        // Initialize network and GUI
        initNetwork();
        initGUI();
        render();
    }
}


var client = new SockickClient();
var renderer = new Render();
setTimeout(function() {
    client.start();
}, 500);

// vim:ts=4:sw=4:expandtab