export class OptimisticUpdateService { apply<T>(state: T, patch: Partial<T>) { return { ...state, ...patch } } }
