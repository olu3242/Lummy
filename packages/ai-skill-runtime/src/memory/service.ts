export class MemoryService {
	status() {
		console.debug('MemoryService.status called')
		return { component: 'memory', governed: true, replaySafe: true }
	}
}
