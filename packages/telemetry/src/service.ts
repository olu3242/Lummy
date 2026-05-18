import type { TelemetryEvent } from "@lummy/shared-types"
import type { TelemetrySink } from "./sdk"

export class TelemetryService {
  constructor(private readonly sink: TelemetrySink) {}

  async track(event: TelemetryEvent): Promise<void> {
    await this.sink.track(event)
  }
}
