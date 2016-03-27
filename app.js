#!/usr/bin/env node

var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var utils = require('./utils');

server.listen(8020);

app.get('/', function (request, response) {
    response.sendFile(__dirname + '/templates/index.html');
});

app.use('/static', express.static('static'));

io.on('connection', function(client) {
    // New game

    var game = new utils.Game(13, 11, 0.5);

    var nickname = null;

    client.once('auth', function(event) {
        var cleanNickname = (event.nickname || '').toString().trim();

        if (!cleanNickname.length) {
            client.emit('message', {type: 'error', text: 'Bad nickname!'});
            client.disconnect('GTFO');
        } else {
            nickname = cleanNickname;

            client.emit('message', {type: 'info', text: 'Hello ' + cleanNickname + '!'});
            client.emit('start');

            console.log('New game for player ' + nickname);

            game.players = [
                new utils.Player(game, 0, {x: 0, y: 0}, client, nickname),
                new utils.Player(game, 1, {x: 0, y: 10}, null, 'CPU 1'),
                new utils.Player(game, 2, {x: 12, y: 0}, null, 'CPU 2'),
                new utils.Player(game, 3, {x: 12, y: 10}, null, 'CPU 3')
            ];

            setTimeout(function() {
                game.players[1].enableAI();
                game.players[2].enableAI();
                game.players[3].enableAI();

                game.start();
            }, 500);

            // setInterval(function() {
            //     console.log('DANGEROUS CELLS:', game.players[0].getDangerousCells());
            // }, 1000);

            game.players.forEach(function(player) {
                client.emit('spawn:player', player.serialize());
            });

            // client.on('');
        }
    });

    client.emit('field', {field: game.field})
});
