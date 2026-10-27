class Pacman {
    constructor(gx, gy) {
        this.spawnGx = gx;
        this.spawnGy = gy;
        this.reset();
    }

    reset() {
        this.x = this.spawnGx;
        this.y = this.spawnGy;
        this.dir = DIR.NONE;
        this.nextDir = DIR.NONE;
        this.speed = AI_SETTINGS.actors.pacmanSpeed;
        this.lastPelletDistance = Infinity;
    }

    setNextDirection(newDir) {
        this.nextDir = newDir;
        if (!aiMode) initAudio();
    }

    update() {
        if (this.nextDir !== DIR.NONE && this.nextDir !== this.dir) {
            const alignedX = this.nextDir.y !== 0 ? Math.round(this.x) : this.x;
            const alignedY = this.nextDir.x !== 0 ? Math.round(this.y) : this.y;
            const alignmentError =
                this.nextDir.x !== 0
                    ? Math.abs(this.y - alignedY)
                    : Math.abs(this.x - alignedX);

            const turnTolerance = Math.max(this.speed * 1.75, 0.16);
            if (
                alignmentError <= turnTolerance &&
                this.canMoveInDir(this.nextDir, alignedX, alignedY)
            ) {
                this.x = alignedX;
                this.y = alignedY;
                this.dir = this.nextDir;
            }
        }

        moveActor(this, this.dir, this.speed);
        this.eatPellet();
        if (aiMode) trackVisitedTile();
    }

    eatPellet() {
        const tileX = Math.floor(this.x + 0.5);
        const tileY = Math.floor(this.y + 0.5);
        if (tileY < 0 || tileY >= ROWS || tileX < 0 || tileX >= COLS) return;

        const tile = grid[tileY][tileX];
        if (tile !== '.' && tile !== 'o') return;

        grid[tileY][tileX] = ' ';
        removePelletFromCache(tileX, tileY);
        pelletsLeft--;
        pelletsCollected++;

        const gained =
            tile === '.'
                ? AI_SETTINGS.rewards.dot
                : AI_SETTINGS.rewards.powerPellet;
        score += gained;
        rewardEvent(tile === '.' ? 'dot' : 'powerPellet', gained);

        if (!aiMode) playSound(tile === '.' ? 'chomp' : 'power');
        if (tile === 'o') triggerFrightenedState();
        updateScoreUI();

        if (pelletsLeft <= 0 && gameState === 'PLAYING') {
            advanceToNextLevel();
        }
    }

    canMoveInDir(direction, x = this.x, y = this.y) {
        return canMoveInDirection(x, y, direction);
    }

    draw() {
        const px = (this.x + 0.5) * TILE_SIZE;
        const py = (this.y + 0.5) * TILE_SIZE;
        const direction = this.dir === DIR.NONE ? 'RIGHT' : this.dir.name;
        const frames = pacmanSprites[direction];
        if (!frames || frames.length === 0) return;

        const frame = frames[Math.floor(frameCount / 8) % frames.length];
        imageMode(CENTER);
        image(frame, px, py, TILE_SIZE, TILE_SIZE);
    }
}
