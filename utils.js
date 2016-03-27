exports.initField = function(width, height, fillPercentage) {
    // Block types:
    // 0: Player
    // 1: Bomb
    // 2: Breakable
    // 3: Concrete

    var field = new Array(height);

    for (var y = 0; y < height; y++) {
        console.log('y=', y);
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

    console.log(field);

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

    return field;
};

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
}

Vector.prototype.mul = function(other) {
    var other = new Vector(other);
    return new Vector(this.x * other.x, this.y * other.y);
}

Vector.prototype.equals = function(other) {
    var other = new Vector(other);
    return this.x == other.x && this.y == other.y;
}

Vector.prototype.serialize = function() {
    return {
        x: this.x,
        y: this.y
    };
};

exports.Vector = Vector;

exports.Player = function(id, pos) {
    this.id = id;
    this.pos = new Vector(pos);
    this.isMoving = false;
    this.targetPos = null;

    this.bombsRemaining = 1;
}

exports.Player.prototype = {};

exports.Player.prototype.moveTo = function(targetPos) {
    if (this.isMoving) {
        return;
    }

    this.targetPos = new Vector(targetPos);
    this.isMoving = true;
    setTimeout(function() {
        this.pos = this.targetPos;
        this.targetPos = null;

        setTimeout(function() {
            this.isMoving = false;
        }.bind(this), 125);
    }.bind(this), 125);
};

exports.Player.prototype.serialize = function() {
    return {
        id: this.id,
        pos: this.pos.serialize()
    };
};

var bombId = 0;

exports.Bomb = function(owner_id, pos, onBoom) {
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
