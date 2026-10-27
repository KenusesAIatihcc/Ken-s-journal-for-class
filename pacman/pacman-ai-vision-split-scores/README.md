# LU08 - Genetic Algorithm

```
'########:::::'###:::::'######:::::::::::'##::::'##::::'###::::'##::: ##:
 ##.... ##:::'## ##:::'##... ##:::::::::: ###::'###:::'## ##::: ###:: ##:
 ##:::: ##::'##:. ##:: ##:::..::::::::::: ####'####::'##:. ##:: ####: ##:
 ########::'##:::. ##: ##:::::::'#######: ## ### ##:'##:::. ##: ## ## ##:
 ##.....::: #########: ##:::::::........: ##. #: ##: #########: ##. ####:
 ##:::::::: ##.... ##: ##::: ##:::::::::: ##:.:: ##: ##.... ##: ##:. ###:
 ##:::::::: ##:::: ##:. ######::::::::::: ##:::: ##: ##:::: ##: ##::. ##:
..:::::::::..:::::..:::......::::::::::::..:::::..::..:::::..::..::::..::
```

> Learning Outcome: Reinforce using Git and optimizing genetic algorithms.

This project is a clone of the classic game Pac-Man built with [p5.js](https://p5js.org/).
The ghost can be controlled by a player or a genetic algorithm.
The goal of this project is to optimize the performance of the AI controlling the ghost using a genetic algorithm.

![UI-Screenshot](assets/ui-screenshot.webp)

## What Do I Do?

- Fork this repository to your own GitHub account.
- Clone **your forked repository** to your local machine.
- Adjust the settings in [`js/AISettings.js`](js/AISettings.js) to experiment with the AI's
  performance.
    - Feel free to use LLMs to help you understand the code and make improvements.
- Add, Commit, and Push your changes to your forked repository.

```bash
## Clone Down YOUR forked repository
git clone <YOUR_FORKED_REPO_URL>
## After your changes, add, commit, and push your changes
git add .
git commit -m "Your commit message"
git push
```

## What to Turn in?

- A link to **your GitHub repository** containing your code and assets.
- A screenshot of your AI's highest score in the game.


## Optimization / Reward Pass

This version adds:
- Larger, more useful neural network inputs (pellet direction, ghost state, fright state, current direction).
- Cached pellet positions instead of scanning the full maze on every AI decision.
- AI decisions every few simulation ticks instead of every tick.
- Squared-distance collision checks in hot code paths.
- Tournament selection, elitism, and generation-scaled mutation.
- Fitness shaping for exploration, moving toward pellets, level completion, ghost eating, and anti-idling.
- Faster AI training speed control (up to 50x).
- `pacman:reward` browser events for dots, power pellets, ghosts, and levels.
- Faster board editor painting with Pointer Events and cached Pac-Man spawn tracking.


## Separate High Scores + Maze Vision

- Player high score and AI best score are now stored independently.
- `Reset Scores` clears both score records and the legacy combined score key.
- The AI now receives 8 additional short-range maze-vision inputs:
  - open-corridor depth in each cardinal direction
  - proximity of the next intersection in each cardinal direction
- The network input count is now 24.
- When a dangerous ghost is nearby, the controller has a modest bias toward open routes and upcoming intersections, while the neural network still determines the final move.
