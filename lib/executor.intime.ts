import { isString, isFunction, isAsyncFunction } from 'sat-utils';
import { buildCommandExecutor } from './command.executor.builder';
import { sleep } from './helpers';
import { logger } from './logger';
import { internalLogStartCycle, internalLogEndCycle, internalLogIntimeCommand } from './logger.execution';

import type { TBuildOpts } from './lib.types';

async function intimeExecutor(
  runOptions: TBuildOpts,
  commandsArray,
): Promise<{ retriable: string[]; notRetriable: string[] }> {
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
    watcher,
    logStartCycle = internalLogStartCycle,
    logEndCycle = internalLogEndCycle,
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

    const watcherRunner =
      watcher &&
      setInterval(
        () =>
          watcher({
            notRetriable: Array.from(notRetriable),
            retriable: Array.from(retriable),
            inProgressCommands: Array.from(inProgressCommands),
            initialCommandsCount,
          }),
        5000,
      );

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
