var Game = function() {
    this.field = [];
};

Game.prototype = {};

Game.prototype.start = function() {
    var socket = io('http://127.0.0.1:8020/');

    var keyDownHandler = function(e) {
        var code = e.which;
        if (code >= 37 && code <= 40) {
            socket.emit('move', {direction: code - 37});
            e.preventDefault();
        } else if (code == 32) {
            socket.emit('c4');
            e.preventDefault();
        }
    };

    socket.on('start', function(event) {
        $('#auth-activity').removeClass('in').addClass('out');
        window.setTimeout(function() {
            $('#game-activity').removeClass('out').addClass('in');
        }, 250);

        $(window).focus().on('keydown', keyDownHandler);
    });

    socket.on('field', function(event) {
        var $field = $('.field');

        event.field.forEach(function(line, y) {
            line.forEach(function(block, x) {
                var $block = $('<div/>').addClass('block').addClass('pos-' + x + '-' + y);
                if (block) {
                    if (block.type == 2) {
                        $block.addClass('breakable');
                    } else if (block.type == 3) {
                        $block.addClass('concrete');
                    }
                }
                $block.css({left: x * 50, top: y * 50});
                $field.append($block);
            });
        });
    });

    socket.on('field:block:destroy', function(event) {
        var $block = $('.pos-' + event.pos.x + '-' + event.pos.y);
        $block.remove();
    });

    socket.on('spawn:player', function(event) {
        var $field = $('.field');

        var $block = $('<div/>').addClass('block');
        $block.addClass('player').addClass('team-' + event.id);
        $block.css({left: event.pos.x * 50, top: event.pos.y * 50});
        $field.append($block);
    });

    socket.on('spawn:bomb', function(event) {
        var $field = $('.field');

        var $block = $('<div/>').addClass('block');
        $block.addClass('bomb').addClass('bomb-' + event.id);
        $block.css({left: event.pos.x * 50, top: event.pos.y * 50});
        $field.append($block);
    });

    socket.on('explode:bomb', function(event) {
        var $bomb = $('.bomb.bomb-' + event.id);
        $bomb.remove();

        var x = event.pos.x * 50 + 25;
        var y = event.pos.y * 50 + 25;

        var vectors = [
            {x: -1, y: 0},
            {x: 0, y: -1},
            {x: 1, y: 0},
            {x: 0, y: 1}
        ];

        vectors.forEach(function(vector, i) {
            var explosionLength = event.explosionLengths[i];

            if (explosionLength > 0) {
                vector.x = vector.x * explosionLength * 50;
                vector.y = vector.y * explosionLength * 50;

                console.log(x, y, vector.x, vector.y);

                spawnFire($('.field'), {x: x, y: y}, {x: x + vector.x, y: y + vector.y});
            }
        });
    });

    socket.on('bomb:count', function(event) {
        $('#bomb-count .value').html(event.count);
    });

    socket.on('move:player', function(event) {
        var $block = $('.block.player.team-' + event.id);
        $block.css({left: event.moveTarget.x * 50, top: event.moveTarget.y * 50});
    });

    socket.on('kill:player', function(event) {
        var icon;
        if (event.isSuicide) {
            icon = '/static/images/icon_suicide.png';
        } else {
            icon = '/static/images/icon_frag.png';
        }
        Materialize.toast(event.attacker + '<img src="' + icon + '" style="margin: 0 0.5rem">' + event.victim, 10000);

        $('.field .block.player.team-' + event.victimId).remove();
    });

    socket.on('message', function(message) {
        Materialize.toast(message.text, 5000);
    });

    socket.on('disconnect', function() {
        socket.disconnect();
        $('#start-game').prop('disabled', false).html('Start game');

        $(window).off('keydown', keyDownHandler);

        $('#game-activity').removeClass('in').addClass('out');
        window.setTimeout(function() {
            $('.field').empty();
            $('#auth-activity').removeClass('out').addClass('in');
        }, 250);
    });

    socket.emit('auth', {nickname: $('#nickname').val()});
};

var spawnFire = function($container, start, end) {
    var length = Math.sqrt(start.x * start.x + start.y * start.y);
    var direction = {x: end.x - start.x, y: end.y - start.y};

    // Normalize vector
    direction.x /= length;
    direction.y /= length;

    var $explosion = $('<div/>').addClass('explosion');
    $explosion.css({left: start.x, top: start.y});
    $('.field').append($explosion);

    window.setTimeout(function() {
        $explosion.remove();
    }, 500);

    window.setTimeout(function() {
        for (var i = 0; i < length; i += 10) {
            (function(i) {
                window.setTimeout(function() {
                    var pos = {x: start.x, y: start.y};
                    pos.x = pos.x + direction.x * i + Math.random() * 20 - 10;
                    pos.y = pos.y + direction.y * i + Math.random() * 20 - 10;

                    var $particle = $('<div/>').addClass('fire');
                    $particle.css({left: pos.x, top: pos.y});
                    $('.field').append($particle);

                    window.setTimeout(function() {
                        $particle.remove();
                    }, 500);
                }, i / 5);
            })(i);
        }
    }, 25);
};

$(window).ready(function() {
    $authActivity = $('#auth-activity');
    var $gameActivity = $('#game-activity');

    $('#start-game').on('click', function(e) {
        e.preventDefault();
        $(this).prop('disabled', true).html('Connecting...');
        var game = new Game();
        game.start();
    });
});
