export class SimulationReplayService { replay(runId: string) { return { runId, queue: "simulation.retry" } } }
