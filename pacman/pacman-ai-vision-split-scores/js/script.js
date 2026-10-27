// Game state tracking
let gameState = 'READY'; // READY, PLAYING, GAMEOVER
let score = 0;
let playerHighScore = parseInt(
    localStorage.getItem('ihcc_pacman_player_highscore') || '0',
);
let aiHighScore = parseInt(
    localStorage.getItem('ihcc_pacman_ai_highscore') || '0',
);
let level = 1;
let maxLevelReached = 1;
let pelletsLeft = 0;
let pelletsCollected = 0;
let agentFrames = 0;
let aiMode = false;
let simulationSpeed = AI_SETTINGS.simulation.speedDefault;
let frightenedTimer = 0;
let aiDecisionCountdown = 0;
let agentRewardAdjustment = 0;
let lastProgressFrame = 0;
let visitedTiles = new Set();
let pelletPositions = [];
let cachedNearestPellet = null;
let cachedNearestPelletFrom = '';
let lastPacmanTileKey = '';
let stalledFrames = 0;

const UI = {
    canvas: document.querySelector('#canvas-container'),
    gameMessage: document.querySelector('#game-message'),
    resetButton: document.querySelector('#reset'),
    userModeButton: document.querySelector('#user-mode-btn'),
    aiModeButton: document.querySelector('#ai-mode-btn'),
    speedSlider: document.querySelector('#speed-up-slider'),
    speedValue: document.querySelector('#speed-value'),
    generation: document.querySelector('#gen-display'),
    agent: document.querySelector('#agent-display'),
    playerHighScore: document.querySelector('#player-highscore-display'),
    aiHighScore: document.querySelector('#ai-highscore-display'),
    resetHighScoresButton: document.querySelector('#reset-highscores'),
    level: document.querySelector('#level-display'),
};

let geneticAlgorithm = null;

// Web Audio Synthesizer
let audioCtx = null;

// '1' = wall, '.' = dot, 'o' = power pellet, '0' = tunnel, 'P' = Pac-Man spawn.
const mapLayout = [
    '111111111111111111111111111',
    '1..Go......o...........G..1',
    '1.11111.1.1.1.11111.11111.1',
    '1...1...1o1.1.1.....1.o..o1',
    '1o1.1.1.1...1.1.111.1.111.1',
    '0.1.1.1.11111P1o1...1...1.0',
    '1.1.1.1.1...1.1...1.1.1...1',
    '1.1.1.1.1.1.1.1.111.1.111.1',
    '1...1...1o1.1.1.o...1.o...1',
    '1.11111.1.1.1.11111.11111.1',
    '1..Go..................G..1',
    '111111111111111111111111111',
];

const COLS = mapLayout[0].length;
const ROWS = mapLayout.length;
const TUNNEL_ROW = 5;
let TILE_SIZE = 20; // Calculated dynamically in setup

let grid = [];
let pacman;
let ghosts = [];
let pacmanSprites = {};
let ghostSprites = {};

// Directions
const DIR = {
    NONE: { x: 0, y: 0, name: 'NONE' },
    UP: { x: 0, y: -1, name: 'UP' },
    DOWN: { x: 0, y: 1, name: 'DOWN' },
    LEFT: { x: -1, y: 0, name: 'LEFT' },
    RIGHT: { x: 1, y: 0, name: 'RIGHT' },
};

const DIRECTIONS = [DIR.UP, DIR.DOWN, DIR.LEFT, DIR.RIGHT];


function rewardEvent(type, points = 0, extra = {}) {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(
            new CustomEvent('pacman:reward', {
                detail: { type, points, score, level, aiMode, ...extra },
            }),
        );
    }
}

function trackVisitedTile() {
    const x = Math.round(pacman.x);
    const y = Math.round(pacman.y);
    const key = `${x},${y}`;
    if (!visitedTiles.has(key)) {
        visitedTiles.add(key);
        agentRewardAdjustment += AI_SETTINGS.rewards.uniqueTileBonus;
    }
}

function rebuildPelletCache() {
    pelletPositions = [];
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (grid[r][c] === '.' || grid[r][c] === 'o') {
                pelletPositions.push({ x: c, y: r });
            }
        }
    }
    cachedNearestPellet = null;
    cachedNearestPelletFrom = '';
}

function removePelletFromCache(x, y) {
    const index = pelletPositions.findIndex((p) => p.x === x && p.y === y);
    if (index >= 0) pelletPositions.splice(index, 1);
    cachedNearestPellet = null;
    cachedNearestPelletFrom = '';
}

function nearestPelletOffset() {
    const px = Math.round(pacman.x * 2) / 2;
    const py = Math.round(pacman.y * 2) / 2;
    const cacheKey = `${px},${py},${pelletPositions.length}`;
    if (cacheKey === cachedNearestPelletFrom && cachedNearestPellet) {
        return cachedNearestPellet;
    }

    let best = null;
    let bestD2 = Infinity;
    for (const pellet of pelletPositions) {
        const dx = pellet.x - pacman.x;
        const dy = pellet.y - pacman.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < bestD2) {
            bestD2 = d2;
            best = { dx, dy, distance: Math.sqrt(d2) };
        }
    }
    cachedNearestPelletFrom = cacheKey;
    cachedNearestPellet = best || { dx: 0, dy: 0, distance: 0 };
    return cachedNearestPellet;
}

function normalizeTileX(x, y) {
    if (y < 0 || y >= ROWS) return null;
    const hasTunnel =
        y === TUNNEL_ROW && grid[y][0] === '0' && grid[y][COLS - 1] === '0';
    if (!hasTunnel) {
        return x < 0 || x >= COLS ? null : x;
    }
    if (x < 0) return COLS - 1;
    if (x >= COLS) return 0;
    return x;
}

function isWalkableTile(x, y) {
    if (y < 0 || y >= ROWS) return false;
    const normalizedX = normalizeTileX(x, y);
    if (normalizedX === null) return false;
    return grid[y][normalizedX] !== '1' && grid[y][normalizedX] !== '-';
}

function canMoveInDirection(x, y, direction) {
    if (direction.x === 0 && direction.y === 0) return false;

    const targetX =
        direction.x > 0
            ? Math.floor(x) + 1
            : direction.x < 0
              ? Math.ceil(x) - 1
              : Math.round(x);
    const targetY =
        direction.y > 0
            ? Math.floor(y) + 1
            : direction.y < 0
              ? Math.ceil(y) - 1
              : Math.round(y);
    return isWalkableTile(targetX, targetY);
}

function moveActor(actor, direction, speed) {
    if (!canMoveInDirection(actor.x, actor.y, direction)) return;

    if (direction.x !== 0) {
        const targetX =
            direction.x > 0 ? Math.floor(actor.x) + 1 : Math.ceil(actor.x) - 1;
        const distance = Math.abs(targetX - actor.x);
        actor.x += direction.x * Math.min(speed, distance);
    } else {
        const targetY =
            direction.y > 0 ? Math.floor(actor.y) + 1 : Math.ceil(actor.y) - 1;
        const distance = Math.abs(targetY - actor.y);
        actor.y += direction.y * Math.min(speed, distance);
    }
    wrapTunnelPosition(actor);
}

function wrapTunnelPosition(actor) {
    if (actor.y < TUNNEL_ROW - 0.5 || actor.y >= TUNNEL_ROW + 0.5) return;
    if (grid[TUNNEL_ROW][0] !== '0' || grid[TUNNEL_ROW][COLS - 1] !== '0') {
        return;
    }
    if (actor.x < -0.5) actor.x += COLS - 1;
    if (actor.x >= COLS - 0.5) actor.x -= COLS - 1;
}

function getWalkableNeighbors(x, y) {
    return DIRECTIONS.flatMap((direction) => {
        const nextX = normalizeTileX(x + direction.x, y + direction.y);
        const nextY = y + direction.y;
        if (nextX === null || !isWalkableTile(nextX, nextY)) return [];
        return [{ x: nextX, y: nextY, direction }];
    });
}

function findDirectionToTarget(startX, startY, targetX, targetY) {
    const start = {
        x: Math.round(startX),
        y: Math.round(startY),
        firstDirection: null,
    };
    const queue = [start];
    const visited = new Set([`${start.x},${start.y}`]);
    let best = start;
    let bestDistance = (start.x - targetX) ** 2 + (start.y - targetY) ** 2;

    for (let index = 0; index < queue.length; index++) {
        const current = queue[index];
        const distance =
            (current.x - targetX) ** 2 + (current.y - targetY) ** 2;
        if (distance < bestDistance) {
            best = current;
            bestDistance = distance;
        }
        if (distance === 0) break;

        for (const neighbor of getWalkableNeighbors(current.x, current.y)) {
            const key = `${neighbor.x},${neighbor.y}`;
            if (visited.has(key)) continue;
            visited.add(key);
            queue.push({
                x: neighbor.x,
                y: neighbor.y,
                firstDirection: current.firstDirection || neighbor.direction,
            });
        }
    }

    return best.firstDirection || DIR.NONE;
}

// TODO remove
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// TODO remove
function playSound(type) {
    if (!audioCtx) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        const now = audioCtx.currentTime;

        if (type === 'chomp') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.exponentialRampToValueAtTime(180, now + 0.07);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.07);
            osc.start(now);
            osc.stop(now + 0.07);
        } else if (type === 'power') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.linearRampToValueAtTime(600, now + 0.2);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
        } else if (type === 'eat_ghost') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.3);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        } else if (type === 'death') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(500, now);
            osc.frequency.linearRampToValueAtTime(80, now + 0.6);
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.6);
            osc.start(now);
            osc.stop(now + 0.6);
        }
    } catch (e) {
        // Audio fallback
    }
}


function getCorridorVision(direction, maxDepth = 5) {
    let x = Math.round(pacman.x);
    let y = Math.round(pacman.y);
    let openSteps = 0;
    let firstIntersection = 0;

    for (let step = 1; step <= maxDepth; step++) {
        const nextY = y + direction.y;
        const nextX = normalizeTileX(x + direction.x, nextY);

        if (nextX === null || !isWalkableTile(nextX, nextY)) break;

        x = nextX;
        y = nextY;
        openSteps = step;

        if (!firstIntersection) {
            const exits = getWalkableNeighbors(x, y).length;
            if (exits >= 3) firstIntersection = step;
        }
    }

    return [
        openSteps / maxDepth,
        firstIntersection
            ? (maxDepth - firstIntersection + 1) / maxDepth
            : 0,
    ];
}

function updateNeatapticController() {
    if (!aiMode || !geneticAlgorithm || gameState !== 'PLAYING') return;

    if (aiDecisionCountdown > 0) {
        aiDecisionCountdown--;
        return;
    }
    aiDecisionCountdown = Math.max(
        0,
        AI_SETTINGS.simulation.aiDecisionInterval - 1,
    );

    const pellet = nearestPelletOffset();
    const nearestDotDistX = pellet.dx / COLS;
    const nearestDotDistY = pellet.dy / ROWS;

    let ghostDistX = AI_SETTINGS.inputs.noGhostOffset;
    let ghostDistY = AI_SETTINGS.inputs.noGhostOffset;
    let minGhostD2 = Infinity;
    let nearestGhostState = 0;

    for (const g of ghosts) {
        const dx = g.x - pacman.x;
        const dy = g.y - pacman.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < minGhostD2) {
            minGhostD2 = d2;
            ghostDistX = dx / COLS;
            ghostDistY = dy / ROWS;
            nearestGhostState =
                g.state === 'FRIGHTENED' ? -1 : g.state === 'EATEN' ? 0 : 1;
        }
    }

    const legal = DIRECTIONS.map((direction) =>
        pacman.canMoveInDir(direction) ? 1 : 0,
    );

    const ghostDistanceNorm =
        minGhostD2 === Infinity ? 1 : Math.min(1, Math.sqrt(minGhostD2) / 10);

    // Short-range maze vision:
    // for UP/DOWN/LEFT/RIGHT, give the network:
    //   1) normalized open corridor depth
    //   2) proximity of the next intersection
    const corridorVision = DIRECTIONS.flatMap((direction) =>
        getCorridorVision(direction),
    );

    const inputs = [
        nearestDotDistX,
        nearestDotDistY,
        ghostDistX,
        ghostDistY,
        ...legal,
        nearestGhostState,
        frightenedTimer > 0 ? 1 : 0,
        pacman.dir.x,
        pacman.dir.y,
        ghostDistanceNorm,
        pellet.distance ? Math.min(1, pellet.distance / 12) : 0,
        pelletsLeft / Math.max(1, pelletsCollected + pelletsLeft),
        level / 10,
        ...corridorVision,
    ];

    const outputs = geneticAlgorithm.activate(inputs);
    if (!outputs) return;

    // Strong behavior prior:
    // normal state -> prefer directions that increase ghost distance
    // frightened state -> prefer directions that reduce ghost distance
    // always ignore blocked moves
    let bestIndex = -1;
    let bestValue = -Infinity;

    for (let i = 0; i < DIRECTIONS.length; i++) {
        if (!legal[i]) continue;

        const direction = DIRECTIONS[i];
        let value = outputs[i];

        const testX = pacman.x + direction.x;
        const testY = pacman.y + direction.y;

        let nearestAfterD2 = Infinity;
        for (const g of ghosts) {
            if (g.state === 'EATEN') continue;
            const dx = g.x - testX;
            const dy = g.y - testY;
            const d2 = dx * dx + dy * dy;
            if (d2 < nearestAfterD2) nearestAfterD2 = d2;
        }

        if (nearestAfterD2 < Infinity) {
            const frightened = frightenedTimer > 0;
            value += frightened
                ? -0.35 * Math.sqrt(nearestAfterD2)
                : 0.35 * Math.sqrt(nearestAfterD2);
        }

        // When a dangerous ghost is nearby, slightly prefer routes that
        // stay open and lead toward an intersection, giving Pac-Man room to turn.
        if (frightenedTimer <= 0 && nearestAfterD2 < 25) {
            const [openDepth, intersectionSignal] = getCorridorVision(direction);
            value += openDepth * 0.12 + intersectionSignal * 0.18;
        }

        // small bias toward pellet progress when not in immediate danger
        if (pellet.distance > 0) {
            const pelletAfterDx = pellet.dx - direction.x;
            const pelletAfterDy = pellet.dy - direction.y;
            const pelletAfter = Math.sqrt(
                pelletAfterDx * pelletAfterDx +
                pelletAfterDy * pelletAfterDy
            );
            value += 0.12 * (pellet.distance - pelletAfter);
        }

        // discourage immediate reversal unless it helps escape or hunt
        if (
            pacman.dir !== DIR.NONE &&
            direction.x === -pacman.dir.x &&
            direction.y === -pacman.dir.y
        ) {
            value -= frightenedTimer > 0 ? 0.02 : 0.08;
        }

        if (value > bestValue) {
            bestValue = value;
            bestIndex = i;
        }
    }

    if (bestIndex >= 0) {
        pacman.setNextDirection(DIRECTIONS[bestIndex]);
    }
}
function setup() {
    TILE_SIZE = Math.floor(
        Math.min(UI.canvas.clientWidth, windowWidth - 32, 1000) / COLS,
    );

    const canvas = createCanvas(COLS * TILE_SIZE, ROWS * TILE_SIZE);
    canvas.parent(UI.canvas);

    initGameGrid();
    updateScoreUI();
    UI.resetButton.addEventListener('click', resetGame);
    UI.resetHighScoresButton?.addEventListener('click', resetHighScores);
    UI.userModeButton.addEventListener('click', startUserGame);
    UI.aiModeButton.addEventListener('click', startAIGame);
    UI.speedSlider.addEventListener('input', updateSimulationSpeed);

    UI.speedSlider.min = AI_SETTINGS.simulation.speedMinimum;
    UI.speedSlider.max = AI_SETTINGS.simulation.speedMaximum;
    UI.speedSlider.step = AI_SETTINGS.simulation.speedStep;
    UI.speedSlider.value = AI_SETTINGS.simulation.speedDefault;
    updateSimulationSpeed();
    frameRate(AI_SETTINGS.simulation.framesPerSecond);
}

function preload() {
    const directions = ['up', 'down', 'left', 'right'];
    for (const direction of directions) {
        pacmanSprites[direction.toUpperCase()] = [1, 2, 3].map((frame) =>
            loadImage(`assets/sprites/pacman-${direction}/${frame}.png`),
        );
    }

    for (const name of ['Blinky', 'Pinky', 'Inky', 'Clyde']) {
        ghostSprites[name] = loadImage(
            `assets/sprites/ghosts/${name.toLowerCase()}.png`,
        );
    }
    ghostSprites.frightened = loadImage('assets/sprites/ghosts/blue_ghost.png');
}

function windowResized() {
    TILE_SIZE = Math.floor(
        Math.min(UI.canvas.clientWidth, windowWidth - 32, 1000) / COLS,
    );
    resizeCanvas(COLS * TILE_SIZE, ROWS * TILE_SIZE);
}

function initGameGrid() {
    grid = [];
    pelletsLeft = 0;
    ghosts = [];

    for (let r = 0; r < ROWS; r++) {
        grid[r] = [];
        for (let c = 0; c < COLS; c++) {
            const char = mapLayout[r][c];
            grid[r][c] = char;

            if (char === '.') pelletsLeft++;
            if (char === 'o') pelletsLeft++;

            if (char === 'P') {
                if (!pacman) {
                    pacman = new Pacman(c, r);
                } else {
                    pacman.spawnGx = c;
                    pacman.spawnGy = r;
                    pacman.reset();
                }
                grid[r][c] = ' '; // Clear tile underneath spawn
            }
        }
    }

    // Initialize 4 Ghosts
    ghosts = [
        new Ghost(12, 10, 'Blinky', COLS - 2, 1),
        new Ghost(13, 10, 'Pinky', 1, 1),
        new Ghost(14, 10, 'Inky', COLS - 2, ROWS - 2),
        new Ghost(15, 10, 'Clyde', 1, ROWS - 2),
    ];

    rebuildPelletCache();
}

function resetGame() {
    if (aiMode) {
        startAIGame();
        return;
    }

    frightenedTimer = 0;
    score = 0;
    level = 1;
    maxLevelReached = 1;
    pelletsCollected = 0;
    agentFrames = 0;
    agentRewardAdjustment = 0;
    visitedTiles = new Set();
    aiDecisionCountdown = 0;
    gameState = 'READY';
    initGameGrid();
    updateScoreUI();
    updateProgressUI();
}

function startUserGame() {
    aiMode = false;
    UI.speedSlider.disabled = true;
    resetGame();
}

function startAIGame() {
    aiMode = true;
    UI.speedSlider.disabled = false;

    try {
        geneticAlgorithm = new GeneticAlgorithm();
        geneticAlgorithm.start();
    } catch (error) {
        console.error(error);
        aiMode = false;
        UI.speedSlider.disabled = true;
        UI.gameMessage.textContent =
            'AI could not start. Check that Neataptic loaded, then refresh.';
        return;
    }

    score = 0;
    level = 1;
    maxLevelReached = 1;
    pelletsCollected = 0;
    agentFrames = 0;
    agentRewardAdjustment = 0;
    visitedTiles = new Set();
    aiDecisionCountdown = 0;
    frightenedTimer = 0;
    stalledFrames = 0;
    lastPacmanTileKey = '';
    gameState = 'PLAYING';
    initGameGrid();
    updateScoreUI();
    updateProgressUI();
    UI.gameMessage.textContent = getAgentMessage();
}
function updateSimulationSpeed() {
    simulationSpeed = Number(UI.speedSlider.value);
    UI.speedValue.value = `${simulationSpeed}×`;
    UI.speedValue.textContent = `${simulationSpeed}×`;
}

function getAgentMessage() {
    return `GENERATION ${geneticAlgorithm.generation} - AGENT ${geneticAlgorithm.agentIndex + 1}/${geneticAlgorithm.populationSize}`;
}

function advanceToNextLevel() {
    level++;
    maxLevelReached = Math.max(maxLevelReached, level);
    frightenedTimer = 0;
    initGameGrid();
    rewardEvent('level', AI_SETTINGS.rewards.levelCompletedBonus, { level });
    updateProgressUI();
    UI.gameMessage.textContent = aiMode ? getAgentMessage() : `LEVEL ${level}`;
}

function finishAIAgent() {
    const survivalSeconds =
        agentFrames / AI_SETTINGS.simulation.framesPerSecond;

    const productiveTimeAllowance = pelletsCollected * 1.8;
    const idleSeconds = Math.max(0, survivalSeconds - productiveTimeAllowance);

    const fitness =
        score +
        pelletsCollected * AI_SETTINGS.rewards.collectedPelletBonus +
        (level - 1) * AI_SETTINGS.rewards.levelCompletedBonus +
        survivalSeconds * AI_SETTINGS.rewards.survivalPointsPerSecond +
        agentRewardAdjustment -
        idleSeconds * AI_SETTINGS.rewards.idlePenaltyPerSecond -
        AI_SETTINGS.rewards.deathPenalty;

    geneticAlgorithm.completeAgent(Math.max(0, fitness));

    score = 0;
    level = 1;
    pelletsCollected = 0;
    agentFrames = 0;
    agentRewardAdjustment = 0;
    visitedTiles = new Set();
    aiDecisionCountdown = 0;
    stalledFrames = 0;
    lastPacmanTileKey = '';
    frightenedTimer = 0;
    initGameGrid();
    gameState = 'PLAYING';
    updateScoreUI();
    updateProgressUI();
    UI.gameMessage.textContent = getAgentMessage();
}
function triggerFrightenedState() {
    frightenedTimer = AI_SETTINGS.actors.frightenedDurationFrames;
    for (let g of ghosts) {
        if (g.state !== 'EATEN') {
            g.state = 'FRIGHTENED';
            g.dir = reverseDirection(g.dir);
        }
    }
}

function reverseDirection(direction) {
    return (
        DIRECTIONS.find(
            (candidate) =>
                candidate.x === -direction.x && candidate.y === -direction.y,
        ) || DIR.NONE
    );
}

function handlePacmanDeath() {
    if (!aiMode) playSound('death');
    frightenedTimer = 0;
    updateScoreUI();
    if (aiMode) {
        finishAIAgent();
        return;
    }

    gameState = 'GAMEOVER';
}

function updateScoreUI() {
    if (aiMode) {
        if (score > aiHighScore) {
            aiHighScore = score;
            localStorage.setItem('ihcc_pacman_ai_highscore', aiHighScore);
        }
    } else if (score > playerHighScore) {
        playerHighScore = score;
        localStorage.setItem('ihcc_pacman_player_highscore', playerHighScore);
    }

    UI.playerHighScore.textContent = String(playerHighScore).padStart(6, '0');
    UI.aiHighScore.textContent = String(aiHighScore).padStart(6, '0');
}

function resetHighScores() {
    playerHighScore = 0;
    aiHighScore = 0;
    localStorage.removeItem('ihcc_pacman_player_highscore');
    localStorage.removeItem('ihcc_pacman_ai_highscore');
    // Also remove the legacy combined score so it cannot reappear in older builds.
    localStorage.removeItem('ihcc_pacman_highscore');
    updateScoreUI();
    UI.gameMessage.textContent = 'Player and AI high scores reset.';
}

function updateProgressUI() {
    UI.generation.textContent = geneticAlgorithm
        ? String(geneticAlgorithm.generation)
        : '1';
    UI.agent.textContent = geneticAlgorithm
        ? `${geneticAlgorithm.agentIndex + 1}/${geneticAlgorithm.populationSize}`
        : '-';
    UI.level.textContent = String(maxLevelReached);
}


function nearestActiveGhostDistance() {
    let best = Infinity;
    for (const g of ghosts) {
        if (g.state === 'EATEN') continue;
        const dx = g.x - pacman.x;
        const dy = g.y - pacman.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < best) best = d2;
    }
    return best === Infinity ? Infinity : Math.sqrt(best);
}

function updateGame() {
    if (gameState !== 'PLAYING') return;
    if (aiMode) agentFrames++;

    const previousPelletDistance = aiMode ? nearestPelletOffset().distance : 0;
    const previousGhostDistance = aiMode ? nearestActiveGhostDistance() : Infinity;

    updateNeatapticController();
    if (frightenedTimer > 0) frightenedTimer--;
    pacman.update();

    if (aiMode) {
        const tileKey = `${Math.round(pacman.x)},${Math.round(pacman.y)}`;
        if (tileKey === lastPacmanTileKey) {
            stalledFrames++;
        } else {
            lastPacmanTileKey = tileKey;
            stalledFrames = 0;
        }

        const nextGhostDistance = nearestActiveGhostDistance();

        // Behavioral shaping:
        // survive/escape normal ghosts, aggressively close distance while powered.
        if (Number.isFinite(previousGhostDistance) && Number.isFinite(nextGhostDistance)) {
            if (frightenedTimer > 0) {
                if (nextGhostDistance < previousGhostDistance) {
                    agentRewardAdjustment +=
                        AI_SETTINGS.rewards.frightenedChaseBonusPerStep;
                } else if (nextGhostDistance > previousGhostDistance) {
                    agentRewardAdjustment -=
                        AI_SETTINGS.rewards.frightenedRetreatPenaltyPerStep;
                }
            } else {
                if (nextGhostDistance < 2.5) {
                    agentRewardAdjustment -=
                        AI_SETTINGS.rewards.dangerPenaltyPerStep;
                }
                if (nextGhostDistance > previousGhostDistance && previousGhostDistance < 5) {
                    agentRewardAdjustment +=
                        AI_SETTINGS.rewards.safeEscapeBonusPerStep;
                }
            }
        }

        const maxFrames =
            AI_SETTINGS.simulation.maxAgentSeconds *
            AI_SETTINGS.simulation.framesPerSecond;
        const maxStalledFrames =
            AI_SETTINGS.simulation.stalledAgentSeconds *
            AI_SETTINGS.simulation.framesPerSecond;

        if (agentFrames >= maxFrames || stalledFrames >= maxStalledFrames) {
            finishAIAgent();
            return;
        }
    }

    if (aiMode && pelletPositions.length) {
        const nextDistance = nearestPelletOffset().distance;
        if (nextDistance < previousPelletDistance) {
            agentRewardAdjustment += AI_SETTINGS.rewards.moveTowardPelletBonus;
        } else if (nextDistance > previousPelletDistance) {
            agentRewardAdjustment -= AI_SETTINGS.rewards.moveAwayFromPelletPenalty;
        }
    }

    const activeNetwork = aiMode ? geneticAlgorithm.currentNetwork : null;
    for (const ghost of ghosts) {
        ghost.update();
        if (
            gameState !== 'PLAYING' ||
            (aiMode && geneticAlgorithm.currentNetwork !== activeNetwork)
        ) {
            break;
        }
    }

    if (aiMode && agentFrames - lastProgressFrame >= 30) {
        lastProgressFrame = agentFrames;
        updateProgressUI();
    }
}
function draw() {
    if (gameState === 'PLAYING') {
        const stepsPerFrame = aiMode ? simulationSpeed : 1;
        for (let step = 0; step < stepsPerFrame; step++) {
            updateGame();
            if (gameState !== 'PLAYING') break;
        }
    }

    background(5, 5, 12);

    // Render Maze Grid
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const tile = grid[r][c];
            const x = c * TILE_SIZE;
            const y = r * TILE_SIZE;

            if (tile === '1') {
                fill(15, 23, 42);
                stroke(30, 80, 255);
                strokeWeight(1.5);
                rect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2, 3);
            } else if (tile === '.') {
                // Pac-Dot
                fill(255, 235, 59);
                noStroke();
                ellipse(x + TILE_SIZE / 2, y + TILE_SIZE / 2, TILE_SIZE * 0.25);
            } else if (tile === 'o') {
                // Power Pellet (Pulsing)
                const pulse = sin(frameCount * 0.15) * 2;
                fill(0, 229, 255);
                noStroke();
                ellipse(
                    x + TILE_SIZE / 2,
                    y + TILE_SIZE / 2,
                    TILE_SIZE * 0.55 + pulse,
                );
            } else if (tile === '-') {
                // Ghost House Door
                stroke(255, 184, 255);
                strokeWeight(2);
                line(x, y + TILE_SIZE / 2, x + TILE_SIZE, y + TILE_SIZE / 2);
            }
        }
    }

    // Draw Entities
    pacman.draw();
    ghosts.forEach((g) => g.draw());

    // Overlay Screen States
    if (gameState === 'READY') {
        fill(0, 0, 0, 180);
        rect(0, 0, width, height);
        textAlign(CENTER, CENTER);
        fill(255, 235, 59);
        textFont('Press Start 2P');
        textSize(16);
        text('IHCC PAC-MAN', width / 2, height / 2 - 20);
        fill(255);
        textSize(10);
        text('PRESS W A S D TO START', width / 2, height / 2 + 20);
    } else if (gameState === 'GAMEOVER') {
        fill(0, 0, 0, 200);
        rect(0, 0, width, height);
        textAlign(CENTER, CENTER);
        fill(255, 50, 50);
        textFont('Press Start 2P');
        textSize(18);
        text('GAME OVER', width / 2, height / 2 - 15);
        fill(255);
        textSize(10);
        text('PRESS SPACE TO RESTART', width / 2, height / 2 + 25);
    }
}

function keyPressed() {
    initAudio();

    if (gameState === 'GAMEOVER' && keyCode === 32) {
        resetGame();
        gameState = 'PLAYING';
        UI.gameMessage.textContent = 'GO!';
        return;
    }

    const directionByKey = {
        w: DIR.UP,
        a: DIR.LEFT,
        s: DIR.DOWN,
        d: DIR.RIGHT,
    };
    const direction = directionByKey[key.toLowerCase()];
    if (!direction) return;

    if (gameState === 'READY') {
        gameState = 'PLAYING';
    }
    pacman.setNextDirection(direction);
    return false;
}

function handleVirtualKey(dirName) {
    initAudio();
    if (gameState === 'READY') {
        gameState = 'PLAYING';
    }
    if (DIR[dirName]) {
        pacman.setNextDirection(DIR[dirName]);
    }
}
