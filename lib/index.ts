import { logger } from 'sat-utils';
import { getPollTime } from './helpers';
import { circleExecutor } from './executor.circle';
import { intimeExecutor } from './executor.intime';

import type { TBuildOpts } from './lib.types';

function reRunnerBuilder(runOptions) {
  const { logLevel = 'ERROR', intime = false, ...executorOptions } = runOptions;

  logger.setLogLevel(logLevel);

  return intime ? intimeExecutor.bind(this, executorOptions) : circleExecutor.bind(this, executorOptions);
}

export type TRunner = {
  (commands: string[] | Array<(index: number) => any>): Promise<{ notRetriable: string[]; retriable: string[] }>;
};

const getReruner = ({
  maxThreads = 5,
  attemptsCount = 2,
  longestProcessTime = 450_000,
  pollTime = 1000,
  successExitCode = 0,
  ...rest
}: TBuildOpts = {}): TRunner => {
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

export type { TBuildOpts } from './lib.types';
export { getReruner };
