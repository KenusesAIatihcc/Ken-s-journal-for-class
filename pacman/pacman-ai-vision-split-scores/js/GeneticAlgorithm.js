class GeneticAlgorithm {
    constructor(populationSize = AI_SETTINGS.geneticAlgorithm.populationSize) {
        this.populationSize = populationSize;
        this.inputCount = AI_SETTINGS.network.inputCount;
        this.hiddenCount = AI_SETTINGS.network.hiddenNeuronCount;
        this.outputCount = AI_SETTINGS.network.outputCount;
        this.generation = 1;
        this.agentIndex = 0;
        this.population = [];
        this.bestFitness = -Infinity;
        this.bestEverNetworkJSON = null;
    }

    start() {
        if (typeof neataptic === 'undefined') {
            throw new Error('Neataptic is required to run AI training.');
        }
        this.generation = 1;
        this.agentIndex = 0;
        this.bestFitness = -Infinity;
        this.bestEverNetworkJSON = null;
        this.population = Array.from(
            { length: this.populationSize },
            () => ({ network: this.createNetwork(), fitness: null }),
        );
    }

    createNetwork() {
        return new neataptic.architect.Perceptron(
            this.inputCount,
            this.hiddenCount,
            this.outputCount,
        );
    }

    get currentNetwork() {
        return this.population[this.agentIndex]?.network || null;
    }

    activate(inputs) {
        return this.currentNetwork?.activate(inputs) || null;
    }

    completeAgent(fitness) {
        const agent = this.population[this.agentIndex];
        if (!agent) throw new Error('There is no active AI agent to complete.');
        agent.fitness = Number.isFinite(fitness) ? fitness : 0;

        if (agent.fitness > this.bestFitness) {
            this.bestFitness = agent.fitness;
            this.bestEverNetworkJSON = agent.network.toJSON();
        }

        this.agentIndex++;
        if (this.agentIndex >= this.populationSize) {
            this.evolve();
            return true;
        }
        return false;
    }

    evolve() {
        this.population.sort((a, b) => b.fitness - a.fitness);

        const eliteCount = Math.min(
            AI_SETTINGS.geneticAlgorithm.eliteCount,
            this.populationSize,
        );

        const nextPopulation = this.population.slice(0, eliteCount).map((agent) => ({
            network: this.cloneNetwork(agent.network),
            fitness: null,
        }));

        const poolSize = Math.min(
            this.population.length,
            Math.max(
                AI_SETTINGS.geneticAlgorithm.minimumParentCount,
                Math.ceil(
                    this.populationSize *
                    AI_SETTINGS.geneticAlgorithm.parentPoolFraction,
                ),
            ),
        );
        const parentPool = this.population.slice(0, poolSize);

        while (nextPopulation.length < this.populationSize) {
            const first = this.selectParent(parentPool);
            const second = this.selectParent(parentPool);
            nextPopulation.push({
                network: this.crossAndMutate(first.network, second.network),
                fitness: null,
            });
        }

        this.population = nextPopulation;
        this.generation++;
        this.agentIndex = 0;
    }

    selectParent(parentPool) {
        const tournamentSize = Math.min(
            AI_SETTINGS.geneticAlgorithm.tournamentSize || 3,
            parentPool.length,
        );
        let winner = null;
        for (let i = 0; i < tournamentSize; i++) {
            const candidate =
                parentPool[Math.floor(Math.random() * parentPool.length)];
            if (!winner || candidate.fitness > winner.fitness) winner = candidate;
        }
        return winner;
    }

    cloneNetwork(network) {
        return neataptic.Network.fromJSON(network.toJSON());
    }

    crossAndMutate(firstNetwork, secondNetwork) {
        const child = this.cloneNetwork(firstNetwork);
        const secondConnections = secondNetwork.connections;
        const mutationScale = Math.max(0.45, 1 / Math.sqrt(this.generation));

        child.connections.forEach((connection, index) => {
            if (
                secondConnections[index] &&
                Math.random() < AI_SETTINGS.geneticAlgorithm.crossoverRate
            ) {
                connection.weight = secondConnections[index].weight;
            }
            if (Math.random() < AI_SETTINGS.geneticAlgorithm.mutationRate) {
                connection.weight +=
                    (Math.random() * 2 - 1) *
                    AI_SETTINGS.geneticAlgorithm.mutationStrength *
                    mutationScale;
            }
        });
        return child;
    }
}
