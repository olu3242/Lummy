export class AutonomousDecisionService { evaluate(decisionId: string) { return { decisionId, queue: "decision.evaluate", replaySafe: true } } }
