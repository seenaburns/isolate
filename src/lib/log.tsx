// Types for log forwarding
export enum LogSeverity {
  Info,
  Error,
  Fatal
}

export interface Log {
  severity: LogSeverity;
  msg: string;
}
