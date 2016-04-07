// var Game = function() {
//     this.field = [];
// };

// Game.prototype = {};

// Game.prototype.start = function() {
//     var socket = io('http://127.0.0.1:8020/');

//     var keyDownHandler = function(e) {
//         var code = e.which;
//         if (code >= 37 && code <= 40) {
//             socket.emit('move', {direction: code - 37});
//             e.preventDefault();
//         } else if (code == 32) {
//             socket.emit('c4');
//             e.preventDefault();
//         }
//     };

//     socket.on('start', function(event) {
//         $('#auth-activity').removeClass('in').addClass('out');
//         window.setTimeout(function() {
//             $('#game-activity').removeClass('out').addClass('in');
//         }, 250);

//         $(window).focus().on('keydown', keyDownHandler);
//     });

//     socket.on('field', function(event) {
//         var $field = $('.field');

//         event.field.forEach(function(line, y) {
//             line.forEach(function(block, x) {
//                 var $block = $('<div/>').addClass('block').addClass('pos-' + x + '-' + y);
//                 if (block) {
//                     if (block.type == 2) {
//                         $block.addClass('breakable');
//                     } else if (block.type == 3) {
//                         $block.addClass('concrete');
//                     }
//                 }
//                 $block.css({left: x * 50, top: y * 50});
//                 $field.append($block);
//             });
//         });
//     });

//     socket.on('field:block:destroy', function(event) {
//         var $block = $('.pos-' + event.pos.x + '-' + event.pos.y);
//         $block.remove();
//     });

//     socket.on('spawn:player', function(event) {
//         var $field = $('.field');

//         var $block = $('<div/>').addClass('block');
//         $block.addClass('player').addClass('team-' + event.id);
//         $block.css({left: event.pos.x * 50, top: event.pos.y * 50});
//         $field.append($block);
//     });

//     socket.on('spawn:bomb', function(event) {
//         var $field = $('.field');

//         var $block = $('<div/>').addClass('block');
//         $block.addClass('bomb').addClass('bomb-' + event.id);
//         $block.css({left: event.pos.x * 50, top: event.pos.y * 50});
//         $field.append($block);
//     });

//     socket.on('explode:bomb', function(event) {
//         var $bomb = $('.bomb.bomb-' + event.id);
//         $bomb.remove();

//         var x = event.pos.x * 50 + 25;
//         var y = event.pos.y * 50 + 25;

//         var vectors = [
//             {x: -1, y: 0},
//             {x: 0, y: -1},
//             {x: 1, y: 0},
//             {x: 0, y: 1}
//         ];

//         vectors.forEach(function(vector, i) {
//             var explosionLength = event.explosionLengths[i];

//             if (explosionLength > 0) {
//                 vector.x = vector.x * explosionLength * 50;
//                 vector.y = vector.y * explosionLength * 50;

//                 console.log(x, y, vector.x, vector.y);

//                 spawnFire($('.field'), {x: x, y: y}, {x: x + vector.x, y: y + vector.y});
//             }
//         });
//     });

//     socket.on('bomb:count', function(event) {
//         $('#bomb-count .value').html(event.count);
//     });

//     socket.on('move:player', function(event) {
//         var $block = $('.block.player.team-' + event.id);
//         $block.css({left: event.moveTarget.x * 50, top: event.moveTarget.y * 50});
//     });

//     socket.on('kill:player', function(event) {
//         var icon;
//         if (event.isSuicide) {
//             icon = '/static/images/icon_suicide.png';
//         } else {
//             icon = '/static/images/icon_frag.png';
//         }
//         Materialize.toast(event.attacker + '<img src="' + icon + '" style="margin: 0 0.5rem">' + event.victim, 10000);

//         $('.field .block.player.team-' + event.victimId).remove();
//     });

//     socket.on('message', function(message) {
//         Materialize.toast(message.text, 5000);
//     });

//     socket.on('disconnect', function() {
//         socket.disconnect();
//         $('#start-game').prop('disabled', false).html('Start game');

//         $(window).off('keydown', keyDownHandler);

//         $('#game-activity').removeClass('in').addClass('out');
//         window.setTimeout(function() {
//             $('.field').empty();
//             $('#auth-activity').removeClass('out').addClass('in');
//         }, 250);
//     });

//     socket.emit('auth', {nickname: $('#nickname').val()});
// };

// var spawnFire = function($container, start, end) {
//     var length = Math.sqrt(start.x * start.x + start.y * start.y);
//     var direction = {x: end.x - start.x, y: end.y - start.y};

//     // Normalize vector
//     direction.x /= length;
//     direction.y /= length;

//     var $explosion = $('<div/>').addClass('explosion');
//     $explosion.css({left: start.x, top: start.y});
//     $('.field').append($explosion);

//     window.setTimeout(function() {
//         $explosion.remove();
//     }, 500);

//     window.setTimeout(function() {
//         for (var i = 0; i < length; i += 10) {
//             (function(i) {
//                 window.setTimeout(function() {
//                     var pos = {x: start.x, y: start.y};
//                     pos.x = pos.x + direction.x * i + Math.random() * 20 - 10;
//                     pos.y = pos.y + direction.y * i + Math.random() * 20 - 10;

//                     var $particle = $('<div/>').addClass('fire');
//                     $particle.css({left: pos.x, top: pos.y});
//                     $('.field').append($particle);

//                     window.setTimeout(function() {
//                         $particle.remove();
//                     }, 500);
//                 }, i / 5);
//             })(i);
//         }
//     }, 25);
// };

// $(window).ready(function() {
//     $authActivity = $('#auth-activity');
//     var $gameActivity = $('#game-activity');

//     $('#start-game').on('click', function(e) {
//         e.preventDefault();
//         $(this).prop('disabled', true).html('Connecting...');
//         var game = new Game();
//         game.start();
//     });
// });

var Engine = function(id, $code) {
    var self = this;

    this.connected = false;

    this.id = id;
    this.$code = $code;

    function betterTab(cm) {
        if (cm.somethingSelected()) {
            cm.indentSelection("add");
        } else {
            cm.replaceSelection(cm.getOption("indentWithTabs")? "\t":
              Array(cm.getOption("indentUnit") + 3).join(" "), "end", "+input");
        }
    }

    this.mirror = CodeMirror.fromTextArea($code.get(0), {
        theme: 'monokai',
        linenumbers: true,
        mode: $code.attr('data-mode'),
        tabSize: 4,
        // keyMap: 'sublime'
        extraKeys: {
            // "Backspace": "smartBackspace",
            "Tab": 'insertSoftTab',
            "Shift-Tab": function(cm) {
                cm.indentSelection("subtract");
                cm.indentSelection("subtract");
            },
            "Ctrl-Enter": function(cm) {
                self.execute();
            }
        },
        indentWithTabs: false,
        viewportMargin: Infinity
    });
};
Engine.prototype = {};
Engine.prototype.start = function() {
    var self = this;

    var socket = io('http://127.0.0.1:8000/');

    socket.on('hello', function() {
        socket.emit('hello', {id: ctx.id});
        Materialize.toast('Connected', 5000);
        self.connected = true;
    });

    socket.on('disconnect', function() {
        Materialize.toast('Disconnected', 5000);
        self.connected = false;
    });

    socket.on('message', function(e) {
        Materialize.toast(e.text, 5000);
    });

    var onChange = function(cm, change) {
        socket.emit('change', {from: change.from, to: change.to, text: change.text[0], removed: change.removed[0]});
    }.bind(this);

    socket.on('change', function(e) {
        console.log('CHANGE:', e);

        this.mirror.off('change', onChange);
        this.mirror.replaceRange(e.text, e.from, e.to);
        this.mirror.on('change', onChange);
    }.bind(this));

    socket.on('client:new', function(event) {
        console.log('New client:', event);
        var $cursor = $('<div/>').addClass('cursor').addClass('cursor-' + event.id);
        $cursor.appendTo($('.overlay'));
    });

    socket.on('client:remove', function(event) {
        console.log('Client removed:', event);
        $('.cursor.cursor-' + event.id).remove();
    });

    socket.on('cursor', function(event) {
        console.log('Cursor', event.id);
        $('.cursor.cursor-' + event.id).css({
            left: event.left,
            top: event.top,
            height: event.bottom - event.top,
        });
    });

    this.mirror.on('change', onChange);
    this.mirror.on('cursorActivity', function(cm, asd) {
        // console.log(cm, asd);
        socket.emit('cursor', cm.cursorCoords(true, 'local'));
    });
};
Engine.prototype.execute = function() {
    alert('exec');
};

$(window).ready(function() {
    if (ctx.rewrite) {
        var url = '/doc' + ctx.id;
        console.log('Rewriting URL to', url);
        history.replaceState({}, document.title, url);
    }

    var $code = $('.code');
    
    var engine = new Engine(ctx.id, $code);

    engine.start();
});
