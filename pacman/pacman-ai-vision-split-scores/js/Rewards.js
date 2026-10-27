(() => {
    const panel = document.querySelector('#rewards-panel');
    if (!panel) return;

    const UI = {
        coins: document.querySelector('#reward-coins'),
        rank: document.querySelector('#reward-rank'),
        progress: document.querySelector('#reward-progress'),
        progressText: document.querySelector('#reward-progress-text'),
        count: document.querySelector('#achievement-count'),
        bestLevel: document.querySelector('#reward-best-level'),
        bestScore: document.querySelector('#reward-best-score'),
        list: document.querySelector('#achievement-list'),
        toast: document.querySelector('#reward-toast'),
        reset: document.querySelector('#reset-rewards'),
    };

    const achievements = [
        { id: 'first-dot', label: 'First Bite', test: s => s.dots >= 1, reward: 25 },
        { id: 'power-up', label: 'Power Up', test: s => s.powerPellets >= 1, reward: 50 },
        { id: 'ghost-hunter', label: 'Ghost Hunter', test: s => s.ghosts >= 1, reward: 100 },
        { id: 'score-1k', label: 'Score 1,000', test: s => s.bestScore >= 1000, reward: 100 },
        { id: 'level-2', label: 'Reach Level 2', test: s => s.bestLevel >= 2, reward: 150 },
        { id: 'ai-gen-5', label: 'AI Generation 5', test: s => s.generation >= 5, reward: 200 },
    ];

    const state = {
        coins: 0,
        dots: 0,
        powerPellets: 0,
        ghosts: 0,
        bestScore: 0,
        bestLevel: 1,
        generation: 1,
        unlocked: new Set(),
    };

    function rankFor(coins) {
        if (coins >= 1500) return ['Legend', 1500, 1500];
        if (coins >= 750) return ['Champion', 750, 1500];
        if (coins >= 250) return ['Hunter', 250, 750];
        return ['Rookie', 0, 250];
    }

    function render() {
        const [rank, min, max] = rankFor(state.coins);
        UI.coins.textContent = String(Math.floor(state.coins));
        UI.rank.textContent = rank;
        UI.progress.max = Math.max(1, max - min);
        UI.progress.value = Math.min(max - min, Math.max(0, state.coins - min));
        UI.progressText.textContent =
            rank === 'Legend'
                ? `${Math.floor(state.coins)} coins`
                : `${Math.floor(state.coins)} / ${max} coins`;
        UI.count.textContent = `${state.unlocked.size} / ${achievements.length}`;
        UI.bestLevel.textContent = String(state.bestLevel);
        UI.bestScore.textContent = String(state.bestScore);

        UI.list.replaceChildren(
            ...achievements.map(a => {
                const li = document.createElement('li');
                li.textContent = `${state.unlocked.has(a.id) ? '✓' : '○'} ${a.label} (+${a.reward})`;
                if (state.unlocked.has(a.id)) li.dataset.unlocked = 'true';
                return li;
            }),
        );
    }

    function checkAchievements() {
        for (const achievement of achievements) {
            if (state.unlocked.has(achievement.id) || !achievement.test(state)) continue;
            state.unlocked.add(achievement.id);
            state.coins += achievement.reward;
            UI.toast.textContent = `Achievement unlocked: ${achievement.label} +${achievement.reward}`;
        }
    }

    window.addEventListener('pacman:reward', event => {
        const detail = event.detail || {};
        if (detail.type === 'dot') state.dots++;
        if (detail.type === 'powerPellet') state.powerPellets++;
        if (detail.type === 'ghost') state.ghosts++;
        if (detail.type === 'level') state.bestLevel = Math.max(state.bestLevel, Number(detail.level) || 1);
        state.bestScore = Math.max(state.bestScore, Number(detail.score) || 0);
        checkAchievements();
        render();
    });

    const observer = new MutationObserver(() => {
        const playerScoreText =
            document.querySelector('#player-highscore-display')?.textContent || '0';
        const aiScoreText =
            document.querySelector('#ai-highscore-display')?.textContent || '0';
        const levelText = document.querySelector('#level-display')?.textContent || '1';
        const genText = document.querySelector('#gen-display')?.textContent || '1';
        state.bestScore = Math.max(
            state.bestScore,
            parseInt(playerScoreText, 10) || 0,
            parseInt(aiScoreText, 10) || 0,
        );
        state.bestLevel = Math.max(state.bestLevel, parseInt(levelText, 10) || 1);
        state.generation = Math.max(state.generation, parseInt(genText, 10) || 1);
        checkAchievements();
        render();
    });

    for (const id of [
        'player-highscore-display',
        'ai-highscore-display',
        'level-display',
        'gen-display',
    ]) {
        const node = document.getElementById(id);
        if (node) observer.observe(node, { childList: true, characterData: true, subtree: true });
    }

    UI.reset?.addEventListener('click', () => {
        state.coins = 0;
        state.dots = 0;
        state.powerPellets = 0;
        state.ghosts = 0;
        state.bestScore = 0;
        state.bestLevel = 1;
        state.generation = 1;
        state.unlocked.clear();
        UI.toast.textContent = 'Session rewards reset.';
        render();
    });

    render();
})();
