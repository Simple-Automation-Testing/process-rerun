import type { ExecOptions } from 'child_process';

export type TBuildOpts = {
  logLevel?: 'ERROR' | 'WARN' | 'INFO' | 'VERBOSE' | 'MUTE';
  maxThreads?: number;
  attemptsCount?: number;
  longestProcessTime?: number;
  successExitCode?: number;
  pollTime?: number;
  execOpts?: ExecOptions;
  processResultAnalyzer?: (originalCommand: string, stack: string, notRetriable: any[]) => string | boolean;
  everyCycleCallback?: () => void;
  watcher?: (data: {
    notRetriable?: string[];
    retriable?: string[];
    inProgressCommands?: string[];
    initialCommandsCount?: number;
  }) => void;
  currentExecutionVariable?: string;
  logStartCycle?: (maxThreads: number | string, attemptsCount: number | string, inTimeCommands: string[]) => void;
  logEndCycle?: (retriable: string[], notRetriable: string[], startTime: number) => void;
  logIteractionCycle?: (cycleNumber: number, commands: string[]) => void;
  logProcessResult?: (cmd: string, startTime: number, execProc, error, stdout, stderr) => void;
  onExitCloseProcess?: (execProc, code: null, signal: string | number) => void;
  onErrorProcess?: (execProc, error) => void;
  logIntimeCommand?: (commadData: { cmd: string; attemptsCount: number }) => void;
};
