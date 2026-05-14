import type { JobEnvelope } from "../../../runtime-orchestrator/src"

export interface DelegationInstruction {
  fromAgentId: string
  toAgentType: string
  reason: string
  job: JobEnvelope
}

export class DelegationService {
  delegate(instruction: DelegationInstruction): DelegationInstruction {
    return instruction
  }
}
