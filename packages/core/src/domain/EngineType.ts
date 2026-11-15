/** The three AegisCode scan engines (SRS: SastEngine, DastEngine, IastEngine). */
export const ENGINE_TYPES = ["SAST", "DAST", "IAST"] as const;

export type EngineType = (typeof ENGINE_TYPES)[number];
