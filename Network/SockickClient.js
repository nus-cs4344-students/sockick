// enforce strict/clean programming
"use strict";

window.mobileAndTabletcheck = function() {
    var check = false;
    (function(a) {
        if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true
    })(navigator.userAgent || navigator.vendor || window.opera);
    return check;
}

function SockickClient() {
    // private variables
    var socket; // socket used to connect to server 
    var playArea; // HTML5 canvas game window 
    var ball; // ball object in game 
    var gameInterval;
    var lastUpdateAt = 0; // timestamp of last recv update


    // player list
    var players = {};
    var myPid;

    // keyboard listener
    var listener = new window.keypress.Listener();
    var preAction = "";

    // key pressed
    var pressedKeys = {
        A: false,
        D: false,
        W: false,
        S: false
    };

    // for mobile control
    var accel;

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
                //console.log(message);
                switch (message.type) {
                    case "update_players":
                        var t = message.timestamp;
                        if (t < lastUpdateAt)
                            break;
                        lastUpdateAt = t;

                        // update players
                        var positions = message.player_positions;
                        var id;
                        for (id in positions) {

                            var p = positions[id];
                            if (players[p.pid] !== undefined) {
                                players[p.pid].x = p.position.x;
                                players[p.pid].y = p.position.y;
                            }

                            if (p.pid === myPid) {
                                //console.log("my position: " + p.position.x + ", " + p.position.y);
                            }
                        }
                        renderer.setTimeLeft(message.timeleft);

                        render();

                        break;
                    case "update_ball":
                        ball.x = message.ball_position.x;
                        ball.y = message.ball_position.y;
                        ball.vx = message.ball_velocity.x;
                        ball.vy = message.ball_velocity.y;
                        break;
                    case "add_player":

                        if (message.is_self) {
                            myPid = message.pid;

                            // add other players information
                            var others = message.other_players;
                            var id;
                            for (id in others) {

                                var player = new Player();
                                player.pid = others[id].pid;
                                player.x = others[id].position.x;
                                player.y = others[id].position.y;
                                players[player.pid] = player;

                                renderer.createPlayer(player.pid, false, others[id].position.x, others[id].position.y);
                                console.log("add player :" + player.pid);
                            }
                        }

                        //add myself
                        renderer.createPlayer(message.pid, message.is_self, message.position.x, message.position.y);
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
                    case "end":
                        alert("Game ended! Final Score: " + message.leftscore + ":" + message.rightscore);
                        break;
                    case "rune_create":
                        renderer.removeRune();
                        renderer.addRune(message.runetype, message.x, message.y);
                        console.log("RuneType is " + message.runetype);
                        console.log("X is " + message.x);
                        console.log("Y is " + message.y);
                        break;
                    case "rune_hit":
                        console.log("Rune hit by " + message.playerid);

                        renderer.removeRune();
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
        if (!window.mobileAndTabletcheck()) {
            setInterval(sendKeyControll, 50);
        } else {
            setInterval(sendTiltControll, 50);
        }
    }

    /**
     * private method sendKeyControll
     *
     * Send the curent key combo to server
     */
    var sendKeyControll = function() {
        var action = "stop";
        // console.log(pressedKeys);

        if (pressedKeys.A && pressedKeys.W) {
            action = "up_left";
        } else if (pressedKeys.A && pressedKeys.S) {
            action = "down_left";
        } else if (pressedKeys.D && pressedKeys.W) {
            action = "up_right";
        } else if (pressedKeys.S && pressedKeys.D) {
            action = "down_right";
        } else if (pressedKeys.A) {
            action = "left";
        } else if (pressedKeys.W) {
            action = "up";
        } else if (pressedKeys.S) {
            action = "down";
        } else if (pressedKeys.D) {
            action = "right";
        }

        // console.log(action);
        if (action !== preAction) {
            sendToServer({
                type: "direction_changed",
                new_direction: action
            });
            preAction = action;
        }

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

    var sendTiltControll = function() {
        var newDX = accel.getAY();
        var newDY = accel.getAX();
        // console.log(newDX,newDY);
        var action = "stop";
        if (newDY > 1 || newDY < -1 || newDX > 1 || newDX < -1)
            action = "";
        if (newDY < -1)
            action += "up";
        if (newDY > 1)
            action += "down";
        if ((newDY > 1 || newDY < -1) && (newDX > 1 || newDX < -1))
            action += "_";
        if (newDX < -1)
            action += "left";
        if (newDX > 1)
            action += "right";

        if (action != "" && action != preAction) {
            sendToServer({
                type: "direction_changed",
                new_direction: action
            });
            preAction = action;

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

    var gameLoop = function () {
        var dt = 1;
        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;
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
        accel = new Accel();
        renderer.init();
        // Initialize network and GUI
        initNetwork();
        initGUI();
        gameInterval = setInterval(function() {gameLoop();}, 1000/Sockick.FRAME_RATE);

        render();
    }
}


var client = new SockickClient();
var renderer = new Render();
setTimeout(function() {
    client.start();
}, 500);

// vim:ts=4:sw=4:expandtab