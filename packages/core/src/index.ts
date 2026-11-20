export { ENGINE_TYPES, type EngineType } from "./domain/EngineType.js";
export { Finding, type FindingLocation, type FindingProps } from "./domain/Finding.js";
export { SEVERITIES, severityRank, type Severity } from "./domain/Severity.js";
export { type EngineScanResult, ScanEngine } from "./engines/ScanEngine.js";
export {
  AegisCodeError,
  DependencyError,
  InvalidInputError,
  ScanFailedError,
  TargetUnreachableError,
} from "./errors.js";
export { ScanPipeline, type ScanResult } from "./pipeline/ScanPipeline.js";
export { ProcessRunner, type ProcessResult, type RunOptions } from "./process/ProcessRunner.js";
export { FindingsStore, type FindingsFilter } from "./store/FindingsStore.js";
