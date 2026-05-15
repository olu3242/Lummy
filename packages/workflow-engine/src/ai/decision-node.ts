export class WorkflowAiDecisionNode { evaluate(confidence: number){ return { confidence, route: confidence >= 0.7 ? "auto" : "human_override" } } }
