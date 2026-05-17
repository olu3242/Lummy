export class MultimodalExecutionCoordinator {
  route(inputMode: "text" | "voice" | "visual") {
    return { inputMode, executionPath: inputMode === "voice" ? "realtime_voice_agent" : "standard_assistant_pipeline" }
  }
}
