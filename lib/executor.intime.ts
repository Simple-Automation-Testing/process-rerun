import {buildCommandExecutor} from './command.executor.builder';
import {sleep} from './helpers';
import {logger} from './logger';
import {shuffleArray} from './utils';

async function intimeExecutor(runOptions, commandsArray): Promise<{retriable: string[]; notRetriable: string[]}> {
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
    shuffle
  } = runOptions;


  const executeCommandAsync = buildCommandExecutor(notRetriable, {
    currentExecutionVariable,
    longestProcessTime,
    processResultAnalyzer,
    pollTime,
    successExitCode
  });

  const inTimeCommands = commandsArray.map((cmd) => ({
    attemptsCount,
    cmd
  }));

  logger.info(`Threads count is: ${maxThreads}`);
  logger.info(`Commands count: ${inTimeCommands.length}`);
  logger.info(`Attempts count is: ${attemptsCount}`);

  async function runCommand(commands) {
    if (maxThreads > currentSessionCount && commands.length) {

      currentSessionCount += 1;
      if (shuffle) {
        shuffleArray(commands);
      }
      const commadData = commands.splice(0, 1)[0] as {cmd: string, attemptsCount: number};
      const executionIndex = commadData.attemptsCount--;

      const result = await executeCommandAsync(commadData.cmd, attemptsCount - executionIndex).catch(console.error);

      if (result) {
        logger.info(`command ${commadData.cmd} failed`);
        logger.info(`attempts count for command is ${commadData.attemptsCount}`);
        commadData.cmd = (result as string);
        if (commadData.attemptsCount > 0) {
          commands.push(commadData);
        } else {
          retriable.push(commadData.cmd);
        }
      }

      currentSessionCount -= 1;
    }
  }
  async function runCommandsArray(commands) {
    const asserter = setInterval(() => runCommand(commands), pollTime);

    do {
      if (commands.length) {
        await runCommand(commands);
      }
      if (currentSessionCount) {
        await sleep(pollTime);
      }
    } while ((commands as Array<{attemptsCount: number}>).some(({attemptsCount}) => attemptsCount) || currentSessionCount);

    clearInterval(asserter);
    return commands;
  }
  const startTime = Date.now();
  await runCommandsArray(inTimeCommands);

  logger.info('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
  logger.info('Failed processes count:', retriable.length + notRetriable.length);
  logger.info('Not retriable processes count:', notRetriable.length);
  logger.info('Retriable processes count:', retriable.length);
  logger.info(`Execution time: ${(Date.now() - startTime) / 1000} seconds`,);
  logger.info('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');

  return {
    retriable,
    notRetriable
  };
}

export {
  intimeExecutor
};
