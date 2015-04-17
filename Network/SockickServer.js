

// enforce strict/clean programming
"use strict"; 

var LIB_PATH = "./../";

require(LIB_PATH + "Sockick.js");
require(LIB_PATH + "Model/Session.js");
require(LIB_PATH + "Model/Player.js");
require(LIB_PATH + "Lib/matter-0.8.0-modified.js");
//require('matter-js');

function SockickServer() {
    // Private Variables
    var port;         // Game port 

    var sessions;


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

            
            sessions = new Object;

            for (var i = 0; i < Sockick.NUM_OF_SESSIONS; i++) {
                sessions[i] = new Session(i);
                sessions[i].start();
            };

            // Upon connection established from a client socket
            sock.on('connection', function (conn) {
                
                console.log("connected");
                var joined = false;
                var joinedSession;
                var date = new Date();
                var currentTime = date.getTime();

                var sessionsDetail = new Array();
                for (var session in sessions) {
                    console.log(sessions[session + ""].count);
                    sessionsDetail.push({
                        sessionid: session,
                        currentsize: sessions[session + ""].count
                    });
                };
                var sessionsInfo = {
                    type: "sessions_info",
                    timestamp: currentTime,
                    sessions: sessionsDetail
                };

                setTimeout(unicast, 0, conn, sessionsInfo);

                conn.on('close', function () {

                    if (joined) {
                        sessions[joinedSession].removePlayer(conn);
                    }
                    
                });

                // When the client send something to the server.
                conn.on('data', function (data) {
                    var message = JSON.parse(data);

                    switch (message.type) {
                        case "direction_changed":
                            var targetSession = sessions[message.sessionid];
                            targetSession.playerChangeDirection(targetSession.players[conn.id], message.new_direction);
                            //player_change_direction(players[conn.id], message.new_direction);
                            break;
                        case "join_session":
                            var targetSession = sessions[message.sessionid];
                            console.log(message.sessionid);
                            var joinResult;
                            if (targetSession.count == Sockick.MAXIMUM_PLAYER) {
                                joinResult = {
                                    type: "joinresult",
                                    result: false,
                                    sessionid: message.sessionid,
                                    reason: "Session is Full"
                                };
                            } else {
                                joined = true;
                                joinedSession = message.sessionid;
                                targetSession.createPlayer(conn);
                                targetSession.startGame();
                                joinResult = {
                                    type: "joinresult",
                                    sessionid: message.sessionid,
                                    result: true,
                                };
                            }
                            setTimeout(unicast, 0, conn, joinResult);
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
