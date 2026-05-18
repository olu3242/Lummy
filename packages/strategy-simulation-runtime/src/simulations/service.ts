export class StrategySimulationService { execute(scenarioId: string) { return { scenarioId, queue: "simulation.execute", replaySafe: true } } }
