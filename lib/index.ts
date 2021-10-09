import {getFilesList, getPollTime} from './helpers';
import {setLogLevel} from './logger';
import {circleExecutor} from './executor.circle';
import {intimeExecutor} from './executor.intime';

function reRunnerBuilder(runOptions) {
  const {logLevel = 'ERROR', intime = false, ...executorOptions} = runOptions;

  setLogLevel(logLevel);
  if (intime) {
    return intimeExecutor.bind(this, executorOptions);
  } else {
    return circleExecutor.bind(this, executorOptions);
  }
}

interface IBuildOpts {
  logLevel?: 'ERROR' | 'WARN' | 'INFO' | 'VERBOSE' | 'MUTE';
  maxThreads?: number,
  attemptsCount?: number,
  longestProcessTime?: number;
  successExitCode?: number;
  pollTime?: number;
  processResultAnalyzer?: (originalCommand: string, stack: string, notRetriable: any[]) => string | null | void;
  everyCycleCallback?: () => void;
  watcher?: () => void;
  currentExecutionVariable?: string;
  logProcessesProgress?: boolean;
}

interface IRunner {
  (commands: string[]): Promise<{notRetriable: string[], retriable: string[]}>;
}

const getReruner = ({
  maxThreads = 5,
  attemptsCount = 2,
  longestProcessTime = 450000,
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
    ...rest
  };

  return reRunnerBuilder(reformattedArgs);
};

export {
  getReruner,
  getFilesList,
  IBuildOpts,
  IRunner
};
