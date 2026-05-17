export * from './client/service'; export * from './auth/service'; export * from './workflows/service'; export * from './events/service'; export * from './ai/service'; export * from './telemetry/service'; export * from './governance/service'; export * from './plugins/service'; export * from './webhooks/service'; export * from './marketplace/service'; export * from './realtime/service'; export * from './ui/service'; export * from './extensions/service';

export class AppRegistry { register(appId:string, tenantId:string){ return { appId, tenantId, installed:true }; } }
export class ExtensionRuntime { execute(extensionId:string, payload:unknown){ return { extensionId, payload, ok:true }; } }
export class PluginSandbox { run(pluginId:string){ return { pluginId, sandboxed:true }; } }
export class IntegrationGateway { dispatch(target:string, body:unknown){ return { target, body, dispatched:true }; } }
