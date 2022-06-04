import { shuffleArrMutable } from 'sat-utils';
import { buildCommandExecutor } from './command.executor.builder';
import { sleep } from './helpers';
import { logger } from './logger';
import {
  internalLogStartCycle,
  internalLogEndCycle,
  internalLogMiddleResultsCycle,
  internalLogIntimeCommand,
} from './logger.execution';

async function intimeExecutor(runOptions, commandsArray): Promise<{ retriable: string[]; notRetriable: string[] }> {
  const notRetriable = [];
  const retriable = [];

  let currentSessionCount = 0;

  const {
    attemptsCount,
    processResultAnalyzer,
    pollTime,
    longestProcessTime,
    successExitCode,
    currentExecutionVariable,
    maxThreads,
    shuffle,
    watcher,
    logProcessesProgress,
    logStartCycle = internalLogStartCycle,
    logEndCycle = internalLogEndCycle,
    logMiddleResultsCycle = internalLogMiddleResultsCycle,
    logIntimeCommand = internalLogIntimeCommand,
  } = runOptions;

  const executeCommandAsync = buildCommandExecutor(notRetriable, {
    currentExecutionVariable,
    longestProcessTime,
    processResultAnalyzer,
    pollTime,
    successExitCode,
  });

  const inTimeCommands = commandsArray.map(cmd => ({
    attemptsCount,
    cmd,
  }));

  logStartCycle(maxThreads, attemptsCount, inTimeCommands);

  async function runCommand(commands) {
    if (maxThreads > currentSessionCount && commands.length) {
      currentSessionCount += 1;
      if (shuffle) {
        shuffleArrMutable(commands);
      }
      const commadData = commands.splice(0, 1)[0] as { cmd: string; attemptsCount: number };
      const executionIndex = commadData.attemptsCount--;

      const result = await executeCommandAsync(commadData.cmd, attemptsCount - executionIndex).catch(error =>
        logger.error(error),
      );

      if (result) {
        logIntimeCommand(commadData);
        commadData.cmd = result as string;
        if (commadData.attemptsCount > 0) {
          commands.push(commadData);
        } else {
          retriable.push(commadData.cmd);
        }
      }

      currentSessionCount -= 1;
    }
  }
  async function runCommandsArray(commands: any[]) {
    const initialCommandsCount = commands.length;
    const asserter = setInterval(() => runCommand(commands), pollTime);

    const logProcessesProgressLoggerRunner =
      logProcessesProgress && setInterval(() => logMiddleResultsCycle(initialCommandsCount, commands), 5000);
    const watcherRunner = watcher && setInterval(watcher, 5000);

    do {
      if (commands.length) {
        await runCommand(commands);
      }
      if (currentSessionCount) {
        await sleep(pollTime);
      }
    } while (
      (commands as Array<{ attemptsCount: number }>).some(({ attemptsCount }) => attemptsCount) ||
      currentSessionCount
    );

    clearInterval(asserter);
    if (logProcessesProgressLoggerRunner) {
      clearInterval(logProcessesProgressLoggerRunner);
    }
    if (watcherRunner) {
      clearInterval(watcherRunner);
    }

    return commands;
  }
  const startTime = Date.now();
  await runCommandsArray(inTimeCommands);

  logEndCycle(retriable, notRetriable, startTime);

  return {
    retriable,
    notRetriable,
  };
}

export { intimeExecutor };
