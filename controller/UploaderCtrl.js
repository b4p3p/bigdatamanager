"use strict";

var SocketIOFileUpload = require('socketio-file-upload'),
    socketio = require('socket.io');
var sync = require('synchronize');
var deasync = require('deasync');

var Project = require("../model/Project");

var io = null;
var fs = null;

var UploaderCtrl = function(server, app){

    app.use(SocketIOFileUpload.router);
    io = socketio.listen(server);
    fs = require('fs');

    io.sockets.on("connection", function(socket){

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

            //salvo i dati caricati
            var projectData = {
                filePath : event.file.pathName,
                username: event.file.meta.username,
                projectName: event.file.meta.projectName,
                type: event.file.meta.type
            };

            var Project = require("../model/Project");

            Project.addData(projectData, function(err, result)
            {
                //fai - success
                ris = result;
            });

            require('deasync').loopWhile(function(){ return ris==null; });

            //cancello il file
            fs.unlinkSync(event.file.pathName);

            //ris = {};
            //ris.message = {};

            event.file.clientDetail.result = ris.message;

        });

        // Error handler:
        uploader.on("error", function(event){
            console.error("Error from uploader", event);
        });
    });

};

module.exports = UploaderCtrl;


