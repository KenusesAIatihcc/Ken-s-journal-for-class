class Ghost {
    constructor(gx, gy, name, scatterX, scatterY) {
        this.spawnGx = gx;
        this.spawnGy = gy;
        this.name = name;
        this.scatterX = scatterX;
        this.scatterY = scatterY;
        this.reset();
    }

    reset() {
        this.x = this.spawnGx;
        this.y = this.spawnGy;
        this.dir = DIR.UP;
        this.state = 'CHASE';
        this.speed = AI_SETTINGS.actors.ghostSpeed;
    }

    update() {
        this.updateState();
        this.turnAtTileCenter();
        this.move();
        this.checkCollision();
    }

    updateState() {
        if (this.state === 'FRIGHTENED' && frightenedTimer <= 0) {
            this.state = 'CHASE';
        }

        if (
            this.state === 'EATEN' &&
            Math.abs(this.x - this.spawnGx) < 0.5 &&
            Math.abs(this.y - this.spawnGy) < 0.5
        ) {
            this.state = frightenedTimer > 0 ? 'FRIGHTENED' : 'CHASE';
        }
    }

    turnAtTileCenter() {
        const tileX = Math.round(this.x);
        const tileY = Math.round(this.y);
        if (
            Math.abs(this.x - tileX) >= this.speed * 0.5 ||
            Math.abs(this.y - tileY) >= this.speed * 0.5
        ) {
            return;
        }

        this.x = tileX;
        this.y = tileY;
        this.chooseNextDirection();
    }

    move() {
        const speed =
            this.state === 'FRIGHTENED'
                ? this.speed *
                  AI_SETTINGS.actors.frightenedGhostSpeedMultiplier
                : this.state === 'EATEN'
                  ? this.speed * AI_SETTINGS.actors.eatenGhostSpeedMultiplier
                  : this.speed;
        moveActor(this, this.dir, speed);
    }

    checkCollision() {
        const dx = this.x - pacman.x;
        const dy = this.y - pacman.y;
        const collisionDistance = AI_SETTINGS.actors.collisionDistance;
        if (
            gameState !== 'PLAYING' ||
            dx * dx + dy * dy >= collisionDistance * collisionDistance
        ) {
            return;
        }

        if (this.state === 'FRIGHTENED') {
            this.state = 'EATEN';
            score += AI_SETTINGS.rewards.ghost;
            rewardEvent('ghost', AI_SETTINGS.rewards.ghost);
            if (!aiMode) playSound('eat_ghost');
            updateScoreUI();
        } else if (this.state !== 'EATEN') {
            handlePacmanDeath();
        }
    }

    chooseNextDirection() {
        let targetX = pacman.x;
        let targetY = pacman.y;

        if (this.state === 'SCATTER') {
            targetX = this.scatterX;
            targetY = this.scatterY;
        } else if (this.state === 'FRIGHTENED') {
            targetX = floor(random(COLS));
            targetY = floor(random(ROWS));
        } else if (this.state === 'EATEN') {
            targetX = this.spawnGx;
            targetY = this.spawnGy;
        } else if (this.name === 'Pinky') {
            targetX += pacman.dir.x * AI_SETTINGS.opponents.pinkyTargetOffset;
            targetY += pacman.dir.y * AI_SETTINGS.opponents.pinkyTargetOffset;
        } else if (this.name === 'Inky') {
            targetX += pacman.dir.x * AI_SETTINGS.opponents.inkyTargetOffset;
            targetY += pacman.dir.y * AI_SETTINGS.opponents.inkyTargetOffset;
        } else if (
            this.name === 'Clyde' &&
            (this.x - pacman.x) ** 2 + (this.y - pacman.y) ** 2 <
                AI_SETTINGS.opponents.clydeScatterDistance ** 2
        ) {
            targetX = this.scatterX;
            targetY = this.scatterY;
        }

        this.dir = findDirectionToTarget(this.x, this.y, targetX, targetY);
    }

    draw() {
        const px = (this.x + 0.5) * TILE_SIZE;
        const py = (this.y + 0.5) * TILE_SIZE;
        const sprite =
            this.state === 'FRIGHTENED'
                ? ghostSprites.frightened
                : ghostSprites[this.name];

        imageMode(CENTER);
        if (this.state === 'EATEN') {
            this.drawEyes(px, py);
            return;
        }

        if (!sprite) return;
        const bob = Math.sin(frameCount * 0.2) * TILE_SIZE * 0.025;
        image(sprite, px, py + bob, TILE_SIZE, TILE_SIZE);
    }

    drawEyes(x, y) {
        fill(255);
        noStroke();
        ellipse(
            x - TILE_SIZE * 0.13,
            y - TILE_SIZE * 0.06,
            TILE_SIZE * 0.2,
            TILE_SIZE * 0.28,
        );
        ellipse(
            x + TILE_SIZE * 0.13,
            y - TILE_SIZE * 0.06,
            TILE_SIZE * 0.2,
            TILE_SIZE * 0.28,
        );
        fill(0, 0, 200);
        const pupilX = this.dir.x * TILE_SIZE * 0.05;
        const pupilY = this.dir.y * TILE_SIZE * 0.05;
        ellipse(
            x - TILE_SIZE * 0.13 + pupilX,
            y - TILE_SIZE * 0.06 + pupilY,
            TILE_SIZE * 0.1,
        );
        ellipse(
            x + TILE_SIZE * 0.13 + pupilX,
            y - TILE_SIZE * 0.06 + pupilY,
            TILE_SIZE * 0.1,
        );
    }
}
