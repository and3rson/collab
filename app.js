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

    var game = {};

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
                new utils.Player(0, {x: 0, y: 0}),
                new utils.Player(1, {x: 0, y: 10}),
                new utils.Player(2, {x: 12, y: 0}),
                new utils.Player(3, {x: 12, y: 10})
            ];

            game.bombs = [];

            game.players.forEach(function(player) {
                client.emit('spawn:player', player.serialize());
            });

            var thisPlayer = game.players[0];

            client.on('move', function(event) {
                var moveTarget = null;
                switch (event.direction) {
                    case 0:
                        moveTarget = thisPlayer.pos.add(new Vector(-1, 0));
                        break;
                    case 1:
                        moveTarget = thisPlayer.pos.add(new Vector(0, -1));
                        break;
                    case 2:
                        moveTarget = thisPlayer.pos.add(new Vector(1, 0));
                        break;
                    case 3:
                        moveTarget = thisPlayer.pos.add(new Vector(0, 1));
                        break;
                }

                if (moveTarget.x >= 0 && moveTarget.y >= 0 && moveTarget.x < 13 && moveTarget.y < 11) {
                    // Attempt to move inside of the map is OK

                    if (game.field[moveTarget.y][moveTarget.x] == null && !thisPlayer.isMoving) {
                        // Target field is empty and player can move

                        var canMove = true;

                        game.players.forEach(function(player) {
                            if (player.pos.equals(moveTarget)) {
                                // Cannot move through other player
                                canMove = false;
                            }
                        });

                        game.bombs.forEach(function(bomb) {
                            if (bomb.pos.equals(moveTarget)) {
                                // Cannot move through bomb
                                canMove = false;
                            }
                        });

                        if (canMove) {
                            thisPlayer.moveTo(moveTarget);
                            client.emit('move:player', {id: thisPlayer.id, moveTarget: moveTarget.serialize()});
                        }
                    }
                }
            });

            client.on('c4', function(event) {
                console.log('Somebody set us up the bomb!')
                if (thisPlayer.bombsRemaining > 0) {
                    var bomb = new utils.Bomb(thisPlayer.id, thisPlayer.pos, function() {
                        var directions = [
                            [new Vector(-1, 0), 3],
                            [new Vector(0, -1), 3],
                            [new Vector(1, 0), 3],
                            [new Vector(0, 1), 3],
                            [new Vector(0, 0), 1]
                        ];

                        var explosionLengths = [];

                        directions.forEach(function(direction) {
                            var vector = direction[0];
                            var maxLength = direction[1];
                            var currentLength = 0;
                            var hasCollided = false;

                            var current = new Vector(bomb.pos);

                            while (maxLength > 0 && !hasCollided) {
                                current = current.add(vector);
                                // console.log('Check', current.x, current.y);

                                if (current.x < 0 || current.y < 0 || current.x >= 13 || current.y >= 11) {
                                    // Hit game field border
                                    hasCollided = true;
                                    currentLength--;
                                } else {
                                    game.players.forEach(function(player) {
                                        if (player.pos.equals(current)) {
                                            // TODO: Damage
                                            console.log('HIT PLAYER', player.id);
                                        }
                                    });

                                    game.bombs.forEach(function(otherBomb) {
                                        if (otherBomb.id == bomb.id) {
                                            return;
                                        }

                                        if (otherBomb.pos.equals(current)) {
                                            console.log('HIT BOMB', otherBomb.id);
                                            otherBomb.explode();
                                        }
                                    });

                                    var block = game.field[current.y][current.x];

                                    if (block) {
                                        if (block.type == 2) {
                                            console.log('DESTROYED WALL');
                                            game.field[current.y][current.x] = null;
                                            hasCollided = true;

                                            client.emit('field:block:destroy', {pos: current});
                                        } else if (block.type == 3) {
                                            console.log('HIT CONCRETE');

                                            hasCollided = true;
                                            currentLength--;
                                        }
                                    }
                                }

                                currentLength++;
                                maxLength--;
                            }

                            if (explosionLengths.length < 4) {
                                explosionLengths.push(currentLength);
                            }
                        });

                        var pos = bomb.pos;

                        console.log('LENGTHS:', explosionLengths);

                        client.emit('explode:bomb', {id: bomb.id, pos: bomb.pos, explosionLengths: explosionLengths});

                        thisPlayer.bombsRemaining++;

                        // Remove bomb from list
                        game.bombs.splice(game.bombs.indexOf(bomb), 1);
                    });
                    // TODO: UNCOMMENT THIS!
                    // thisPlayer.bombsRemaining--;
                    game.bombs.push(bomb);

                    client.emit('spawn:bomb', {id: bomb.id, owner_id: thisPlayer.id, pos: bomb.pos});
                }
            });

            // client.on('');
        }
    });

    game.field = utils.initField(13, 11, 0.75);

    client.emit('field', {field: game.field})
});
