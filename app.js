#!/usr/bin/env node

var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var fs = require('fs');

// var utils = require('./utils');

// server.listen(8091);
try {
    fs.unlinkSync('/var/sock/collab.sock');
} catch(e) {
}
server.listen('/var/sock/collab.sock');

var sessions = {};
var userId = 0;

var handler = function (request, response) {
    var id = '';
    var rewrite = false;
    if (request.params.id) {
        id = request.params.id;
    } else {
        id = Math.floor(Math.random() * 90000000 + 10000000);
        rewrite = true;
    }

    if (!sessions[id]) {
        sessions[id] = {clients: []};
    }

    response.render('index.jade', {
        id: id,
        rewrite: rewrite
    });
    // response.sendFile(__dirname + '/templates/index.html');
};

app.set('view engine', 'jade');

app.get('/', handler);

app.get('/doc:id', handler);

app.use('/static', express.static('static'));

io.on('connection', function(client) {
    // New game

    client.once('hello', function(e) {
        console.log('New client for session', e.id);
        client.id = userId++;

        if (!sessions[e.id]) {
            // client.emit('message', {text: 'Session not found!'});
            // client.disconnect();
            // return;
            sessions[id] = {clients: []};
        }

        var session = sessions[e.id];

        session.clients.push(client);

        var broadcast = function(event, data, exclude) {
            session.clients.forEach(function(other) {
                console.log(other.id);
                if (!exclude || other != exclude) {
                    other.emit(event, data);
                }
            });
        };

        broadcast('client:new', {id: client.id}, client);
        session.clients.forEach(function(other) {
            if (client != other) {
                client.emit('client:new', {id: other.id});
            }
        });

        client.on('change', function(e) {
            console.log('Change:', e.from, e.text, e.removed);

            broadcast('change', e, client);
        });

        client.on('cursor', function(e) {
            console.log('Cursor:', e);

            e.id = client.id;

            broadcast('cursor', e, client);
        });

        client.on('disconnect', function() {
            session.clients.forEach(function(other, i) {
                if (other == client) {
                    session.clients.splice(i, 1);
                }
            });
            broadcast('client:remove', {id: client.id});
        });
    });

    client.emit('hello');

    // var game = new utils.Game(13, 11, 0.5);

    // var nickname = null;

    // client.once('auth', function(event) {
    //     var cleanNickname = (event.nickname || '').toString().trim();

    //     if (!cleanNickname.length) {
    //         client.emit('message', {type: 'error', text: 'Bad nickname!'});
    //         client.disconnect('GTFO');
    //     } else {
    //         nickname = cleanNickname;

    //         client.emit('message', {type: 'info', text: 'Hello ' + cleanNickname + '!'});
    //         client.emit('start');

    //         console.log('New game for player ' + nickname);

    //         game.players = [
    //             new utils.Player(game, 0, {x: 0, y: 0}, client, nickname),
    //             new utils.Player(game, 1, {x: 0, y: 10}, null, 'CPU 1'),
    //             new utils.Player(game, 2, {x: 12, y: 0}, null, 'CPU 2'),
    //             new utils.Player(game, 3, {x: 12, y: 10}, null, 'CPU 3')
    //         ];

    //         setTimeout(function() {
    //             game.players[1].enableAI();
    //             game.players[2].enableAI();
    //             game.players[3].enableAI();

    //             game.start();
    //         }, 500);

    //         // setInterval(function() {
    //         //     console.log('DANGEROUS CELLS:', game.players[0].getDangerousCells());
    //         // }, 1000);

    //         game.players.forEach(function(player) {
    //             client.emit('spawn:player', player.serialize());
    //         });

    //         // client.on('');
    //     }
    // });

    // client.emit('field', {field: game.field})
});
