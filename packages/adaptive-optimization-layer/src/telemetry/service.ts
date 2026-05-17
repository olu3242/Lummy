export class TelemetryService {
	status() {
		console.debug('TelemetryService.status called')
		return { area: 'telemetry' }
	}
}
