import {buildCommandExecutor} from './commandExecutorBuilder';
import {sleep} from './helpers';
import {logger} from './logger';
import {shuffleArray} from './utils';

async function circleExecutor(runOptions, commandsArray): Promise<{retriable: string[]; notRetriable: string[]}> {
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
  } = runOptions;

  /**
   * @see
   * remove lint to initial commands array
   * commandsArray = [...commandsArray]
   */
  commandsArray = [...commandsArray];

  logger.info(`Threads count is: ${maxThreads}`);
  logger.info(`Commands count: ${commandsArray.length}`);
  logger.info(`Attempts count is: ${attemptsCount}`);

  const executeCommandAsync = buildCommandExecutor(notRetriable, {
    currentExecutionVariable,
    longestProcessTime,
    processResultAnalyzer,
    pollTime,
    successExitCode
  });

  async function runCommand(commands, retriable, runIndex) {
    if (maxThreads > currentSessionCount && commands.length) {
      currentSessionCount += 1;
      if (shuffle) {
        shuffleArray(commands);
      }
      const result = await executeCommandAsync(commands.splice(0, 1)[0], runIndex).catch(console.error);
      if (result) {
        retriable.push(result);
      }
      currentSessionCount -= 1;
    }
  }

  async function runCommandsArray(commands, retriable, executionCount) {
    const asserter = setInterval(() => runCommand(commands, retriable, executionCount), pollTime);

    do {
      if (commands.length) {
        await runCommand(commands, retriable, executionCount);
      }
      if (currentSessionCount) {
        await sleep(pollTime);
      }
    } while (commands.length || currentSessionCount);

    if (everyCycleCallback && typeof everyCycleCallback === 'function') {
      try {
        await everyCycleCallback();
      } catch (e) {
        logger.error(e);
      }
    }

    clearInterval(asserter);
    return retriable;
  }
  let resolvedCommandsArray = [...commandsArray];
  const retriable = [];

  for (let index = 0; index < attemptsCount; index++) {
    resolvedCommandsArray = await runCommandsArray(resolvedCommandsArray, [], index);
    if (!resolvedCommandsArray.length) {
      break;
    }
    logger.info('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
    logger.info(`Execution cycle: ${index}`);
    logger.info('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
    logger.info('=========================================================================');
    logger.info(`Processes count: ${resolvedCommandsArray.length}`);
    logger.info('=========================================================================');
  }

  retriable.push(...resolvedCommandsArray);

  logger.info('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
  logger.info('Failed processes count:', retriable.length + notRetriable.length);
  logger.info('Not retriable processes count:', notRetriable.length);
  logger.info('Retriable processes count:', retriable.length);
  logger.info('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');

  return {
    retriable,
    notRetriable
  };
}

export {
  circleExecutor
};
