/* eslint-disable sonarjs/cognitive-complexity */
import { toArray, isFunction, isAsyncFunction, shuffleArrMutable, isString } from 'sat-utils';
import { buildCommandExecutor } from './command.executor.builder';
import { sleep } from './helpers';
import { logger } from './logger';
import {
  internalLogStartCycle,
  internalLogEndCycle,
  internalLogIteractionCycle,
  internalLogMiddleResultsCycle,
} from './logger.execution';

async function circleExecutor(runOptions, commandsArray): Promise<{ retriable: string[]; notRetriable: string[] }> {
  const notRetriable = [];

  let currentSessionCount = 0;

  const {
    attemptsCount,
    processResultAnalyzer,
    pollTime,
    everyCycleCallback,
    longestProcessTime,
    successExitCode,
    currentExecutionVariable,
    maxThreads,
    shuffle,
    logProcessesProgress,
    watcher,
    logProcessResult,
    logStartCycle = internalLogStartCycle,
    logEndCycle = internalLogEndCycle,
    logIteractionCycle = internalLogIteractionCycle,
    logMiddleResultsCycle = internalLogMiddleResultsCycle,
    onExitCloseProcess,
    onErrorProcess,
    execOpts,
  } = runOptions;

  /**
   * @see
   * remove link to initial commands array
   * commandsArray = toArray(commandsArray);
   */
  commandsArray = toArray(commandsArray);
  const inProgressCommands = [];

  logStartCycle(maxThreads, attemptsCount, commandsArray);

  const executeCommandAsync = buildCommandExecutor(notRetriable, {
    currentExecutionVariable,
    longestProcessTime,
    processResultAnalyzer,
    pollTime,
    successExitCode,
    logProcessResult,
    onExitCloseProcess,
    onErrorProcess,
    execOpts,
  });

  async function runCommand(commands, retriable, runIndex) {
    if (maxThreads > currentSessionCount && commands.length) {
      currentSessionCount += 1;
      if (shuffle) {
        shuffleArrMutable(commands);
      }
      let result;

      const commandToExecute = commands.splice(0, 1)[0];
      if (isString(commandToExecute)) {
        const index = inProgressCommands.push(commandToExecute) - 1;
        result = await executeCommandAsync(commandToExecute, runIndex).catch(error => logger.error(error));
        inProgressCommands.splice(index, 1);
      } else if (isFunction(commandToExecute) || isAsyncFunction(commandToExecute)) {
        const index = inProgressCommands.push(commandToExecute.toString()) - 1;
        result = await commandToExecute(runIndex).catch(error => logger.error(error));
        inProgressCommands.splice(index, 1);
      }

      if (result) {
        retriable.push(result);
      }

      currentSessionCount -= 1;
    }
  }

  async function runCommandsArray(commands, retriable, executionCount) {
    const initialCommandsCount = commands.length;

    const asserter = setInterval(() => runCommand(commands, retriable, executionCount), pollTime);

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
        await runCommand(commands, retriable, executionCount);
      }
      if (currentSessionCount) {
        await sleep(pollTime);
      }
    } while (commands.length || currentSessionCount);

    if (isFunction(everyCycleCallback) || isAsyncFunction(everyCycleCallback)) {
      try {
        await everyCycleCallback();
      } catch (error) {
        logger.error(error);
      }
    }

    if (watcherRunner) {
      clearInterval(watcherRunner);
    }

    clearInterval(asserter);
    return retriable;
  }
  let resolvedCommandsArray = toArray(commandsArray);

  const retriable = [];
  const startTime = Date.now();

  for (let index = 0; index < attemptsCount; index++) {
    resolvedCommandsArray = await runCommandsArray(resolvedCommandsArray, [], index);
    if (!resolvedCommandsArray.length) {
      break;
    }

    logIteractionCycle(index, resolvedCommandsArray);
  }

  retriable.push(...resolvedCommandsArray);

  logEndCycle(retriable, notRetriable, startTime);

  return {
    retriable,
    notRetriable,
  };
}

export { circleExecutor };
