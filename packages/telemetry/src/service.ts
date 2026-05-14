import type { TelemetryEvent } from "../../shared-types/src"
import type { TelemetrySink } from "./sdk"

export class TelemetryService {
  constructor(private readonly sink: TelemetrySink) {}

  async track(event: TelemetryEvent): Promise<void> {
    await this.sink.track(event)
  }
}
