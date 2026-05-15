export class AuthService { authorize(scopes: string[], required: string) { return scopes.includes(required) } }
