var Game = function(width, height, fillPercentage) {
    this.field = [];
    this.players = [];
    this.bombs = [];
    this.isRunning = true;

    this.initField(width, height, fillPercentage);
};

Game.prototype = {};

Game.prototype.broadcast = function(event, data) {
    this.players.forEach(function(player) {
        if (player.client) {
            player.client.emit(event, data);
        }
    });
};

Game.prototype.start = function() {
    var game = this;

    var increaseBombCount = function() {
        if (game.isRunning) {
            game.players.forEach(function(player) {
                if (player.isAlive) {
                    player.bombsRemaining++;

                    if (player.client) {
                        player.client.emit('bomb:count', {count: player.bombsRemaining});
                    }
                }
            });
            setTimeout(increaseBombCount, 30000);
        }
    };
    increaseBombCount();
};

Game.prototype.getObjectAtPosition = function(pos, excludePlayer, excludeBomb) {
    var found = null;

    this.players.forEach(function(player) {
        if (excludePlayer && excludePlayer.id == player.id) {
            return;
        }

        if (!player.isAlive) {
            return;
        }

        if (player.pos.equals(pos)) {
            found = player;
        }
    });

    if (found) return found;

    this.bombs.forEach(function(bomb) {
        if (excludeBomb && excludeBomb.id == bomb.id) {
            return;
        }

        if (bomb.pos.equals(pos)) {
            found = bomb;
        }
    });

    if (found) return found;

    return this.field[pos.y][pos.x];
};

Game.prototype.initField = function(width, height, fillPercentage) {
    // Block types:
    // 0: Player
    // 1: Bomb
    // 2: Breakable
    // 3: Concrete

    var field = new Array(height);

    for (var y = 0; y < height; y++) {
        field[y] = new Array(width);

        for (var x = 0; x < width; x++) {
            // if (x == 0 && y == 0) {
            //     field[y][x] = {type: 0, id: 0};
            // } else if (x == 0 && y == height - 1) {
            //     field[y][x] = {type: 0, id: 1};
            // } else if (x == width - 1 && y == 0) {
            //     field[y][x] = {type: 0, id: 2};
            // } else if (x == width - 1 && y == height - 1) {
            //     field[y][x] = {type: 0, id: 3};
            // } else
            if (x % 2 + y % 2 == 2) {
                field[y][x] = {type: 3};
            } else {
                field[y][x] = null;
            }
        };
    };

    var breakablesLeft = Math.floor(((width * height) - ((width - 1) / 2) * ((height - 1) / 2) - 12) * fillPercentage);

    console.log(breakablesLeft);

    while (breakablesLeft > 0) {
        var x = Math.floor(Math.random() * width);
        var y = Math.floor(Math.random() * height);

        if ((y == 0 || y == height - 1) && (x < 2 || x > width - 3)) {
            continue;
        }
        if ((x == 0 || x == width - 1) && (y < 2 || y > height - 3)) {
            continue;
        }

        if (field[y][x] == null) {
            field[y][x] = {type: 2};
            breakablesLeft--;
        }
    }

    this.field = field;
};

Game.prototype.getDangerousCells = function() {
    var game = this;

    var directions = [
        [new Vector(-1, 0), 3],
        [new Vector(0, -1), 3],
        [new Vector(1, 0), 3],
        [new Vector(0, 1), 3],
        [new Vector(0, 0), 1]
    ];

    var dangerousCells = [];

    game.bombs.forEach(function(bomb) {
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
                    var target = game.getObjectAtPosition(current, null, bomb);

                    if (target instanceof Player) {
                        dangerousCells.push(current);
                    } else if (target instanceof Bomb) {
                        dangerousCells.push(current);
                    } else if (target) {
                        if (target.type == 2) {
                            hasCollided = true;
                        } else if (target.type == 3) {
                            hasCollided = true;
                            currentLength--;
                        }
                    } else {
                        dangerousCells.push(current);
                    }
                }

                currentLength++;
                maxLength--;
            }
        });
    });

    return dangerousCells;
};
exports.Game = Game;

Vector = function() {
    if (arguments[0].hasOwnProperty('x') && arguments[0].hasOwnProperty('y')) {
        this.x = arguments[0].x;
        this.y = arguments[0].y;
    } else {
        this.x = arguments[0];
        this.y = arguments[1];
    }
};

Vector.prototype = {};
Vector.prototype.add = function(other) {
    var other = new Vector(other);
    return new Vector(this.x + other.x, this.y + other.y);
};

Vector.prototype.mul = function(other) {
    var other = new Vector(other);
    return new Vector(this.x * other.x, this.y * other.y);
};

Vector.prototype.equals = function(other) {
    var other = new Vector(other);
    return this.x == other.x && this.y == other.y;
};

Vector.prototype.distance = function(other) {
    var other = new Vector(other);
    return Math.sqrt(Math.pow(other.x - this.x, 2) + Math.pow(other.y - this.y, 2));
};

Vector.prototype.serialize = function() {
    return {
        x: this.x,
        y: this.y
    };
};
exports.Vector = Vector;

var Player = function(game, id, pos, client, nickname) {
    this.game = game;
    this.id = id;
    this.pos = new Vector(pos);
    this.client = client;
    this.nickname = nickname;

    this.isMoving = false;
    this.targetPos = null;

    this.isAlive = true;

    this.bombsRemaining = 0;

    if (client) {
        // This is a real connection.
        this.initRealControls();
    } else {
        // This is
        this.initAIControls();
    }
};
exports.Player = Player;

exports.Player.prototype = {};

exports.Player.prototype.initRealControls = function() {
    var thisPlayer = this;
    var game = this.game;
    var client = this.client;

    client.on('move', this.moveToDirection.bind(this));
    client.on('c4', this.setSomebodyABomb.bind(this));
};

exports.Player.prototype.initAIControls = function() {
};

exports.Player.prototype.enableAI = function() {
    var thisPlayer = this;
    var game = this.game;

    var tick = function() {
        if (!game.isRunning) {
            console.log('The game is finished. :)');
            return;
        }
        if (!thisPlayer.isAlive) {
            console.log('I`m dead. :)');
            return;
        }

        var dangerousCells = game.getDangerousCells();
        var isInDanger = false;
        dangerousCells.forEach(function(cell) {
            if (cell.equals(thisPlayer.pos)) {
                isInDanger = true;
            }
        });

        if (isInDanger) {
            console.log('I`M IN DANGER!');

            var safeCells = [];

            for (var y = 0; y < 11; y++) {
                for (var x = 0; x < 13; x++) {
                    var potentiallySafe = new Vector(x, y);
                    if (dangerousCells.filter(function(dangerousCell) { return dangerousCell.equals(potentiallySafe); }).length) {
                        continue;
                    }

                    var objectAtPosition = game.getObjectAtPosition(potentiallySafe);

                    if (!objectAtPosition) {
                        // Cell is free!
                        safeCells.push(potentiallySafe);
                    }
                }
            }

            safeCells.sort(function(a, b) {
                var da = a.distance(thisPlayer.pos);
                var db = b.distance(thisPlayer.pos);
                if (da != db) {
                    return da > db;
                } else {
                    return Math.random() < 0.5;
                }
            });

            var safePath = null;

            safeCells.forEach(function(safeCell) {
                if (!safePath) {
                    safePath = thisPlayer.findPath(safeCell, true);
                }
            });

            if (safePath) {
                console.log('I can escape!');

                thisPlayer.moveTo(safePath[1]);

                setTimeout(tick, 300);
            } else {
                console.log('I`M DOOMED!');

                setTimeout(tick, 300);
            }
        } else {
            var closestEnemy = null;
            var closestDistance = -1;
            game.players.forEach(function(enemy) {
                if (enemy.id == thisPlayer.id) {
                    return;
                }

                if (!enemy.isAlive) {
                    return;
                }

                var distance = thisPlayer.pos.distance(enemy.pos);

                if (distance < closestDistance || closestDistance == -1) {
                    closestEnemy = enemy;
                    closestDistance = distance;
                }
            });

            // FIXME: Random enemy
            // var enemies = game.players.filter(function(enemy) { return enemy.id != thisPlayer.id; });
            // var closestEnemy = enemies[Math.floor(Math.random() * enemies.length)];

            var path = thisPlayer.findPath(closestEnemy.pos);

            if (path) {
                console.log('NEXT STOP:', path[1]);

                var willBeInDanger = false;

                dangerousCells.forEach(function(cell) {
                    if (cell.equals(path[1])) {
                        willBeInDanger = true;
                    }
                });

                if (!willBeInDanger) {
                    var objectAtPosition = game.getObjectAtPosition(path[1]);

                    if (objectAtPosition instanceof Player) {
                        thisPlayer.setSomebodyABomb();
                    } else if (objectAtPosition instanceof Bomb) {
                    } else if (objectAtPosition) {
                        // Breakable wall (concrete wall will never appear here)
                        console.log('WALL');
                        thisPlayer.setSomebodyABomb();
                    } else {
                        thisPlayer.moveTo(path[1]);
                    }
                }
            }
            setTimeout(tick, 260);
        }
    };

    tick();
};

exports.Player.prototype.kill = function(source) {
    var thisPlayer = this;

    this.isAlive = false;

    this.game.broadcast('kill:player', {attacker: source.nickname, victim: this.nickname, victimId: this.id, isSuicide: source.id == this.id});

    if (this.client) {
        this.client.emit('message', {type: 'info', text: 'You are dead. Not a big surprise!'});
        this.client.emit('end');
    }

    if (this.game.players.filter(function(player) { return player.isAlive; }).length == 1) {
        this.game.broadcast('message', {type: 'info', text: thisPlayer.nickname + ' is the winner!'});
        this.game.isRunning = false;
    }
};

Player.prototype.setSomebodyABomb = function() {
    var thisPlayer = this;
    var game = this.game;
    var client = this.client;

    if (!thisPlayer.isAlive) {
        return;
    }

    console.log('Somebody set us up the bomb!')
    if (thisPlayer.bombsRemaining > 0) {
        var bomb = new Bomb(thisPlayer.id, thisPlayer.pos, function() {
            // Remove bomb from list
            game.bombs.splice(game.bombs.indexOf(bomb), 1);

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
                        var target = game.getObjectAtPosition(current, null, bomb);

                        if (target instanceof Player) {
                            console.log('HIT PLAYER');
                            target.kill(thisPlayer);
                        } else if (target instanceof Bomb) {
                            console.log('HIT ANOTHER BOMB');
                            target.explode();
                        } else if (target) {
                            if (target.type == 2) {
                                console.log('DESTROYED WALL');
                                game.field[current.y][current.x] = null;
                                hasCollided = true;

                                game.broadcast('field:block:destroy', {pos: current});
                            } else if (target.type == 3) {
                                console.log('HIT CONCRETE');

                                hasCollided = true;
                                currentLength--;
                            }
                        } else {
                            // That was a failboat
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

            game.broadcast('explode:bomb', {id: bomb.id, pos: bomb.pos, explosionLengths: explosionLengths});

            thisPlayer.bombsRemaining++;
            if (thisPlayer.client) {
                thisPlayer.client.emit('bomb:count', {count: thisPlayer.bombsRemaining});
            }
        });

        thisPlayer.bombsRemaining--;
        game.bombs.push(bomb);

        game.broadcast('spawn:bomb', {id: bomb.id, owner_id: thisPlayer.id, pos: bomb.pos});
        if (thisPlayer.client) {
            thisPlayer.client.emit('bomb:count', {count: thisPlayer.bombsRemaining});
        }
    }
};

Player.prototype.moveToDirection = function(event) {
    var thisPlayer = this;
    var game = this.game;
    var client = this.client;

    if (!thisPlayer.isAlive) {
        return;
    }

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

        if (!thisPlayer.isMoving) {
            // Player is not already moving

            var objectAtPosition = game.getObjectAtPosition(moveTarget);
            console.log(objectAtPosition);

            if (!objectAtPosition) {
                // There is no bomb, player or breakable/concrete wall at the target position

                thisPlayer.moveTo(moveTarget);
            }
        }
    }
};

exports.Player.prototype.moveTo = function(targetPos) {
    if (this.isMoving) {
        return;
    }

    var game = this.game;

    this.game.broadcast('move:player', {id: this.id, moveTarget: targetPos.serialize()});

    this.targetPos = new Vector(targetPos);
    this.isMoving = true;
    setTimeout(function() {
        if (!game.getObjectAtPosition(this.targetPos)) {
            this.pos = this.targetPos;
            this.targetPos = null;
        } else {
            // Oops! The place is already busy!
            this.game.broadcast('move:player', {id: this.id, moveTarget: this.pos});
            this.targetPos = null;
        }

        setTimeout(function() {
            this.isMoving = false;
        }.bind(this), 125);
    }.bind(this), 125);
};

exports.Player.prototype.findPath = function(targetPos, passableOnly) {
    // TODO: Refactor using nextTick

    var game = this.game;

    var directions = [new Vector(-1, 0), new Vector(0, -1), new Vector(1, 0), new Vector(0, 1)];

    var bestPath = null;
    // var minimumTimeRequired = -1;
    var maxDeviation = this.pos.distance(targetPos) + 1;

    var dangerousCells = game.getDangerousCells();

    var processNeighbours = function(pos, history) {
        if (bestPath) return;

        var currentPos = new Vector(pos);

        if (typeof history == 'undefined') {
            history = [pos];
        }

        var possibleNextPosList = [];

        directions.forEach(function(direction) {
            var newPos = currentPos.add(direction);

            if (newPos.x < 0 || newPos.y < 0 || newPos.x >= 13 || newPos.y >= 11) {
                return;
            }

            if (history.filter(function(other) {
                return other.equals(newPos);
            }).length) {
                return;
            }

            if (newPos.distance(targetPos) <= maxDeviation) {
                possibleNextPosList.push(newPos);
            }

//            console.log(direction, newPos);
        });

        possibleNextPosList.sort(function(a, b) {
            return a.distance(targetPos) > b.distance(targetPos);
        });

        possibleNextPosList.forEach(function(newPos) {
            if (newPos.equals(targetPos)) {
                bestPath = history.concat(newPos);
                return;
            }

            // if (dangerousCells.filter(function(dangerousCell) {
            //     return dangerousCell.equals(newPos);
            // }).length) {
            //     return;
            // }

            var objectAtPosition = game.getObjectAtPosition(newPos);

            if (objectAtPosition) {
                if (objectAtPosition instanceof Player) {
                    // Player
                    // if (minimumTimeRequired == -1 || timeRequired < minimumTimeRequired) {
                    // bestPath = history.concat(newPos);

                    // callback(bestPath);
                    // }
                } else if (objectAtPosition instanceof Bomb) {
                    // Bomb
                } else if (objectAtPosition) {
                    // Breakable
                    if (objectAtPosition.type == 2) {
                        // setTimeout(function() {
                            if (!passableOnly) {
                                processNeighbours(newPos, history.concat(newPos));
                            }
                        // }, 0);
                    }
                } else {
                    // Concrete
                }
            } else {
                // Empty
                // setTimeout(function() {
                    processNeighbours(newPos, history.concat(newPos));
                // }, 0);
            }
        });
    };

    var processNeighboursOld = function(pos, history, timeRequired) {
        if (typeof history == 'undefined') {
            history = [];
        }
        if (typeof timeRequired == 'undefined') {
            timeRequired = 0;
        }

        var currentPos = new Vector(pos);

        directions.forEach(function(direction) {
            var newPos = currentPos.add(direction);

            if (newPos.x < 0 || newPos.y < 0 || newPos.x >= 13 || newPos.y >= 11) {
                return;
            }

            console.log('Testing', newPos, ', history is', history);

            if (history.filter(function(other) {
                return other.equals(newPos);
            }).length) {
                return;
            }

            var objectAtPosition = game.getObjectAtPosition(newPos);

            if (objectAtPosition) {
                if (objectAtPosition instanceof Player) {
                    // Player
                    if (minimumTimeRequired == -1 || timeRequired < minimumTimeRequired) {
                        bestPath = history.concat(newPos);
                    }
                } else if (objectAtPosition instanceof Bomb) {
                    // Bomb
                } else if (objectAtPosition) {
                    // Breakable
                    if (objectAtPosition.type == 2) {
                        setTimeout(function() {
                            processNeighbours(newPos, history.concat(newPos), timeRequired + 12);
                        }, 1000);
                    }
                } else {
                    // Concrete
                }
            } else {
                // Empty
                setTimeout(function() {
                    processNeighbours(newPos, history.concat(newPos), timeRequired + 1);
                }, 1000);
            }
        });
    };

    processNeighbours(this.pos);

    return bestPath;

//    console.log('bestPath =', bestPath);
//    console.log('minimumTimeRequired =', minimumTimeRequired);
}

exports.Player.prototype.serialize = function() {
    return {
        id: this.id,
        pos: this.pos.serialize()
    };
};

var bombId = 0;

var Bomb = function(owner_id, pos, onBoom) {
    this.id = bombId++;
    this.owner_id = owner_id;
    this.pos = new Vector(pos);

    this.alive = true;

    this.onBoom = onBoom;

    this.explode = function() {
        if (!this.alive) {
            // Ain't gonna explode again.
            return;
        }

        this.alive = false;
        clearTimeout(this.explodeTimeout);

        this.onBoom();
    };

    this.explodeTimeout = setTimeout(function() {
        // KA-BOOM!

        this.explode();
    }.bind(this), 3000);
};
exports.Bomb = Bomb;
