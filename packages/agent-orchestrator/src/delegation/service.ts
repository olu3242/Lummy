<<<<<<< HEAD
import type { JobEnvelope } from "@lummy/runtime-orchestrator"
=======
import type { JobEnvelope } from "../../../runtime-orchestrator/src"
>>>>>>> main

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
