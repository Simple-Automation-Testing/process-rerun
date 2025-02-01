import { shuffleArrMutable, isString, isFunction, isAsyncFunction } from 'sat-utils';
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
    execOpts,
  } = runOptions;

  const executeCommandAsync = buildCommandExecutor(notRetriable, {
    currentExecutionVariable,
    longestProcessTime,
    processResultAnalyzer,
    pollTime,
    successExitCode,
    execOpts,
  });

  const inTimeCommands = commandsArray.map(cmd => ({
    attemptsCount,
    cmd,
  }));

  const inProgressCommands = [];
  logStartCycle(maxThreads, attemptsCount, inTimeCommands);

  async function runCommand(commands) {
    if (maxThreads > currentSessionCount && commands.length) {
      currentSessionCount += 1;
      if (shuffle) {
        shuffleArrMutable(commands);
      }
      let result;
      const commadData = commands.splice(0, 1)[0] as { cmd; attemptsCount: number };

      const executionIndex = commadData.attemptsCount--;
      if (isString(commadData.cmd)) {
        const index = inProgressCommands.push(commadData.cmd) - 1;
        result = await executeCommandAsync(commadData.cmd, attemptsCount - executionIndex).catch(error =>
          logger.error(error),
        );
        inProgressCommands.splice(index, 1);
      } else if (isFunction(commadData.cmd) || isAsyncFunction(commadData.cmd)) {
        const index = inProgressCommands.push(commadData.cmd.toString()) - 1;
        result = await commadData.cmd(attemptsCount - executionIndex).catch(error => logger.error(error));
        inProgressCommands.splice(index, 1);
      }

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
      logProcessesProgress &&
      setInterval(() => logMiddleResultsCycle(initialCommandsCount, commands, inProgressCommands), 5000);

    const watcherRunner = watcher && setInterval(() => watcher(Array.from(notRetriable), Array.from(retriable)), 5000);

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
