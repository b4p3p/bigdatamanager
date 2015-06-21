"use strict";

var SocketIOFileUpload = require('socketio-file-upload'),
    socketio = require('socket.io');
var sync = require('synchronize');
var deasync = require('deasync');

var Project = require("../model/Project");

var io = null;
var fs = null;
var _app;
var _server;
var _socket = null;

var UploaderCtrl = function(server, app){

    _app = app;
    _server = server;

    app.use(SocketIOFileUpload.router);
    io = socketio.listen(server);
    fs = require('fs');

    io.sockets.on("connection", function(socket){

        _socket = socket;

        var MB = 1024 * 1024;

        // Make an instance of SocketIOFileUpload and listen on this socket:
        var uploader = new SocketIOFileUpload();
        uploader.dir = "./uploads";
        uploader.listen(socket);
        uploader.maxFileSize = MB * 100;              // 10 MB
        uploader.useText = true;
        uploader.chunkSize = 1024 * 50;            // 200k

        // Do something when a file is saved:
        uploader.on("saved", function(event){

            console.log("UPLOAD OK - " + event.file.pathName);

            var ris=null;

            if(event.file.meta.method == "editproject")
            {
                //salvo i dati caricati
                var projectData = {
                    filePath : event.file.pathName,
                    username: event.file.meta.username,
                    projectName: event.file.meta.projectName,
                    type: event.file.meta.type,
                    serverUrl: io.sockets.sockets[0].client.conn.request.headers.host
                };

                var Project = require("../model/Project");

                Project.addData(projectData, function(err, result)
                {
                    ris = result;
                });
            }
            else
            {
                ris = { status:1, error: "missing method" }
            }

            require('deasync').loopWhile(function(){ return ris==null; });

            //cancello il file
            fs.unlinkSync(event.file.pathName);

            //ris = {};
            //ris.message = {};

            event.file.clientDetail.result = ris;

        });

        // Error handler:
        uploader.on("error", function(event){
            console.error("Error from uploader", event);
        });
    });

};

module.exports = UploaderCtrl;


