/**
 * Lummy Canonical Runtime
 *
 * This is the top-level entry point for the operational runtime spine.
 * Import runtime primitives from sub-modules:
 *
 *   import { emitEvent }              from "@/runtime/events"
 *   import { getWorkflowByEventName } from "@/runtime/registry"
 *   import { runAutomationProcessorJob } from "@/runtime/orchestrator"
 *   import { logger, startSLARecord } from "@/runtime/telemetry"
 *   import { callAgent }              from "@/runtime/agents"
 *
 * DO NOT import from packages/workflow-engine, packages/runtime-orchestrator,
 * packages/ai-os, or packages/automation-engine — those are disconnected.
 */

export * from "./events"
export * from "./registry"
export * from "./orchestrator"
export * from "./telemetry"
export * from "./agents"
