export function installGracefulShutdown(onShutdown: () => Promise<void>) { const h = async () => { await onShutdown(); process.exit(0) }; process.on("SIGINT", h); process.on("SIGTERM", h) }
