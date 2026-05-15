export class ApiGatewayService { route(version: string, path: string) { if (!version.startsWith("v")) throw new Error("unversioned api"); return `${version}:${path}` } }
