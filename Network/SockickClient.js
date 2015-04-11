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

    // keyboard listener
    var listener = new window.keypress.Listener();

    // key pressed
    var pressedKeys = {
        A: false,
        D: false,
        W: false,
        S: false
    };

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
                // console.log(message);
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

                            var p = positions[id];
                            if(players[p.pid] !== undefined){
                                players[p.pid].x = p.position.x;
                                players[p.pid].y = p.position.y;
                            }
                        }

                        render();
                        break;
                    case "add_player":

                        if (message.is_self) {
                            myPid = message.pid;

                            // add other players information
                            var others = message.other_players;
                            var id;
                            for (id in others) {

                                var player = new Player();
                                player.pid = others[id].id;
                                player.x = others[id].position.x;
                                player.y = others[id].position.y;
                                players[player.pid] = player;

                                renderer.createPlayer(player.pid, false);
                                console.log("add player :" + player.pid);
                            }
                        }

                        //add myself
                        renderer.createPlayer(message.pid, message.is_self);
                        var player = new Player();
                        player.pid = message.pid;
                        player.x = message.position.x;
                        player.y = message.position.y;
                        players[message.pid] = player;
                        // console.log("add player :"+player.pid);
                        // console.log(players);
                        break;
                    case "delete_player":
                        renderer.deletePlayer(message.pid);
                        delete players[message.pid];
                        break;
                    case "goal":
                        renderer.setScore(message.leftscore, message.rightscore);
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

        // register key combo
        var keycombo = [{
            keys: "w",
            on_keydown: function() {
                return update_key("W", true);
            },
            on_keyup: function() {
                return update_key("W", false);
            }
        }, {
            keys: "a",
            on_keydown: function() {
                return update_key("A", true);
            },
            on_keyup: function() {
                return update_key("A", false);
            }
        }, {
            keys: "s",
            on_keydown: function() {
                return update_key("S", true);
            },
            on_keyup: function() {
                return update_key("S", false);
            }
        }, {
            keys: "d",
            on_keydown: function() {
                return update_key("D", true);
            },
            on_keyup: function() {
                return update_key("D", false);
            }
        }];
        listener.register_many(keycombo);
        setInterval(sendKeyControll, 50);

    }

    /**
     * private method sendKeyControll
     *
     * Send the curent key combo to server
     */
    var sendKeyControll = function() {
        var new_direction = "stop";
        // console.log(pressedKeys);

        if (pressedKeys.A && pressedKeys.W) {
            new_direction = "up_left";
        } else if (pressedKeys.A && pressedKeys.S) {
            new_direction = "down_left";
        } else if (pressedKeys.D && pressedKeys.W) {
            new_direction = "up_right";
        } else if (pressedKeys.S && pressedKeys.D) {
            new_direction = "down_right";
        } else if (pressedKeys.A) {
            new_direction = "left";
        } else if (pressedKeys.W) {
            new_direction = "up";
        } else if (pressedKeys.S) {
            new_direction = "down";
        } else if (pressedKeys.D) {
            new_direction = "right";
        }

        // console.log(new_direction);
        sendToServer({
            type: "direction_changed",
            new_direction: new_direction
        })
    }

    /**
     * private method: move_piece
     *
     *  Update key pressed combo in pressedKeys
     */
    var update_key = function(dir, add) {
        if (add) {
            pressedKeys[dir] = true;
        } else {
            pressedKeys[dir] = false;
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
            if (players[id] === undefined)
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