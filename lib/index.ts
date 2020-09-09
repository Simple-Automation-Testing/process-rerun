import {buildCommandExecutor} from './commandExecutorBuilder';
import {sleep, getFilesList, getPollTime} from './helpers';
import {logger, setLogLevel} from './logger';

function reRunnerBuilder(runOptions) {
  const notRetriable = [];
  let currentSessionCount = 0;

  const {
    attemptsCount,
    processResultAnalyzer,
    // @deprecated
    debugProcess,
    pollTime,
    everyCycleCallback,
    longestProcessTime,
    successExitCode,
    formCommanWithOption,
    currentExecutionVariable,
    maxThreads,
    logLevel = 'ERROR'
  } = runOptions;

  setLogLevel(logLevel);

  const executeCommandAsync = buildCommandExecutor(notRetriable, {
    spawn: false,
    formCommanWithOption,
    currentExecutionVariable,
    longestProcessTime,
    debugProcess,
    processResultAnalyzer,
    pollTime,
    successExitCode
  });

  async function reRunner(commandsArray) {
    /**
     * @see
     * remove likt to initial commands array
     * commandsArray = [...commandsArray]
     */
    commandsArray = [...commandsArray];

    if (debugProcess) {
      logger.info(`Threads count is: ${maxThreads}`);
      logger.info(`Commands count: ${commandsArray.length}`);
      logger.info(`Attempts count is: ${attemptsCount}`);
    }


    async function runCommand(commands, retriable, runIndex) {
      if (maxThreads > currentSessionCount && commands.length) {
        currentSessionCount += 1
        const result = await executeCommandAsync(commands.splice(0, 1)[0], runIndex).catch(console.error);
        if (result) {
          retriable.push(result);
        }
        currentSessionCount -= 1
      }
    }

    async function runCommandsArray(commands, retriable, executionCount) {
      const asserter = setInterval(() => runCommand(commands, retriable, executionCount), pollTime);

      do {
        if (commands.length) {await runCommand(commands, retriable, executionCount)}
        if (currentSessionCount) {await sleep(pollTime)}
      } while (commands.length || currentSessionCount)

      if (everyCycleCallback && typeof everyCycleCallback === 'function') {
        try {
          await everyCycleCallback()
        } catch (e) {
          logger.error(e)
        }
      }

      clearInterval(asserter)
      return retriable
    }
    let resolvedCommandsArray = [...commandsArray];
    const retriable = [];
    for (let index = 0; index < attemptsCount; index++) {
      resolvedCommandsArray = await runCommandsArray(resolvedCommandsArray, [], index);
      if (!resolvedCommandsArray.length) {
        break;
      }
      if (debugProcess) {
        logger.info('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>')
        logger.info(`Execution cycle: ${index}`)
        logger.info('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>')
        logger.info('=========================================================================')
        logger.info(`Processes count: ${resolvedCommandsArray.length}`)
        logger.info('=========================================================================')
      }
    }
    retriable.push(...resolvedCommandsArray);

    if (debugProcess) {
      logger.info('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>')
      logger.info('Failed processes count:', retriable.length + notRetriable.length);
      logger.info('Not retriable processes count:', notRetriable.length);
      logger.info('Retriable processes count:', retriable.length);
      logger.info('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>')
    }

    return {
      retriable,
      notRetriable
    } as {retriable: string[]; notRetriable: string[]}
  }

  return reRunner
}

interface IBuildOpts {
  logLevel?: 'ERROR' | 'WARN' | 'INFO' | 'VERBOSE';
  maxThreads?: number,
  attemptsCount?: number,
  longestProcessTime?: number;
  successExitCode?: number;
  pollTime?: number;
  debugProcess?: boolean;
  processResultAnalyzer?: (originalCommand: string, stack: string, notRetriable: any[]) => string | null | void;
  everyCycleCallback?: () => void;
  formCommanWithOption?: (cmd: string) => {cmd: string; onErrorCloseHandler: () => void};
  currentExecutionVariable?: string;
}


interface IRunner {
  (commands: string[]): Promise<{notRetriable: string[], retriable: string[]}>;
}

const buildRunner = ({
  maxThreads = 5,
  attemptsCount = 2,
  longestProcessTime = 450000,
  pollTime = 1000,
  debugProcess = false,
  successExitCode = 0,
  ...rest
}: IBuildOpts = {}): IRunner => {

  const reformattedArgs = {
    debugProcess,
    longestProcessTime,
    maxThreads,
    attemptsCount,
    successExitCode,
    pollTime: getPollTime(pollTime),
    ...rest
  };

  return reRunnerBuilder(reformattedArgs)
}

const getReruner = function(optsObj) {
  return buildRunner(optsObj)
};

const getSpecFilesArr = getFilesList;

export {
  buildRunner,
  getFilesList,
  getReruner,
  getSpecFilesArr,
  IBuildOpts,
  IRunner
}
