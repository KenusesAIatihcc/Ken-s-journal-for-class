const UI = {
    width: document.querySelector('#width'),
    height: document.querySelector('#height'),
    board: document.querySelector('#board'),
    message: document.querySelector('#message'),
    tileOptions: document.querySelectorAll('input[name="tile"]'),
    createButton: document.querySelector('#create-board'),
    exportButton: document.querySelector('#export-board'),
};

const SYMBOLS = { 1: '#', o: 'o', 0: '0', P: 'P', G: 'G', '.': '.' };
let cells = [];
let painting = false;
let activeTile = [...UI.tileOptions].find((option) => option.checked)?.value || '1';
let pacmanCell = null;

function setTile(cell, tile) {
    if (cell.dataset.tile === tile) return;
    cell.dataset.tile = tile;
    cell.textContent = SYMBOLS[tile];
}

function paint(cell) {
    if (activeTile === 'P') {
        if (pacmanCell && pacmanCell !== cell) setTile(pacmanCell, '.');
        pacmanCell = cell;
    } else if (cell === pacmanCell) {
        pacmanCell = null;
    }
    setTile(cell, activeTile);
}

function createBoard() {
    const width = Math.min(60, Math.max(3, parseInt(UI.width.value, 10) || 28));
    const height = Math.min(60, Math.max(3, parseInt(UI.height.value, 10) || 24));
    UI.width.value = width;
    UI.height.value = height;

    const body = document.createElement('tbody');
    cells = [];
    pacmanCell = null;

    for (let rowIndex = 0; rowIndex < height; rowIndex++) {
        const row = [];
        const tr = document.createElement('tr');
        for (let column = 0; column < width; column++) {
            const cell = document.createElement('td');
            cell.dataset.tile = '.';
            cell.textContent = '.';
            tr.appendChild(cell);
            row.push(cell);
        }
        body.appendChild(tr);
        cells.push(row);
    }

    UI.board.replaceChildren(body);
    UI.message.textContent = `Created ${width}×${height} board.`;
}

async function exportBoard() {
    const rows = cells.map(
        (row) => `    '${row.map((cell) => cell.dataset.tile).join('')}',`,
    );
    const text = `const mapLayout = [\n${rows.join('\n')}\n];`;

    try {
        await navigator.clipboard.writeText(text);
        UI.message.textContent = 'Copied board to clipboard!';
    } catch {
        UI.message.textContent = 'Copy failed — select and copy from the console.';
        console.log(text);
    }
}

UI.tileOptions.forEach((option) =>
    option.addEventListener('change', () => {
        if (option.checked) activeTile = option.value;
    }),
);
UI.createButton.addEventListener('click', createBoard);
UI.exportButton.addEventListener('click', exportBoard);

UI.board.addEventListener('pointerdown', (event) => {
    const cell = event.target.closest('td');
    if (!cell) return;
    painting = true;
    UI.board.setPointerCapture?.(event.pointerId);
    paint(cell);
});
UI.board.addEventListener('pointerover', (event) => {
    const cell = event.target.closest('td');
    if (painting && cell) paint(cell);
});
UI.board.addEventListener('pointerup', () => {
    painting = false;
});
UI.board.addEventListener('pointercancel', () => {
    painting = false;
});

createBoard();
