import { logger } from 'sat-utils';
import { getPollTime } from './helpers';
import { circleExecutor } from './executor.circle';
import { intimeExecutor } from './executor.intime';

function reRunnerBuilder(runOptions) {
  const { logLevel = 'ERROR', intime = false, ...executorOptions } = runOptions;

  logger.setLogLevel(logLevel);

  return intime ? intimeExecutor.bind(this, executorOptions) : circleExecutor.bind(this, executorOptions);
}

type IBuildOpts = {
  logLevel?: 'ERROR' | 'WARN' | 'INFO' | 'VERBOSE' | 'MUTE';
  maxThreads?: number;
  attemptsCount?: number;
  longestProcessTime?: number;
  successExitCode?: number;
  pollTime?: number;
  processResultAnalyzer?: (originalCommand: string, stack: string, notRetriable: any[]) => string | null | void;
  everyCycleCallback?: () => void;
  watcher?: () => void;
  currentExecutionVariable?: string;
  logProcessesProgress?: boolean;
  logStartCycle?: (maxThreads: number | string, attemptsCount: number | string, inTimeCommands: string[]) => void;
  logEndCycle?: (retriable: string[], notRetriable: string[], startTime: number) => void;
  logIteractionCycle?: (cycleNumber: number, commands: string[]) => void;
  logMiddleResultsCycle?: (initialCount: number, commands: string[]) => void;
  logProcessResult?: (cmd: string, startTime: number, execProc, error, stdout, stderr) => void;
};

type IRunner = {
  (commands: string[]): Promise<{ notRetriable: string[]; retriable: string[] }>;
};

const getReruner = ({
  maxThreads = 5,
  attemptsCount = 2,
  longestProcessTime = 450_000,
  pollTime = 1000,
  successExitCode = 0,
  ...rest
}: IBuildOpts = {}): IRunner => {
  const reformattedArgs = {
    longestProcessTime,
    maxThreads,
    attemptsCount,
    successExitCode,
    pollTime: getPollTime(pollTime),
    ...rest,
  };

  return reRunnerBuilder(reformattedArgs);
};

export { getReruner, IBuildOpts, IRunner };

export { getFilesList } from './helpers';
