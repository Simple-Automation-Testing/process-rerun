/* eslint-disable sonarjs/cognitive-complexity */
import { isFunction, isAsyncFunction, isNumber, millisecondsToMinutes } from 'sat-utils';
import { internalLogProcessResult } from './logger.execution';
import { execute } from './exec';
import { logger } from './logger';
import { ProcessRerunError } from './error';

function buildExecRunner(notRetriable, runOpts) {
  const {
    currentExecutionVariable,
    longestProcessTime,
    processResultAnalyzer,
    execOpts = { maxBuffer: 1000 * 1024 },
    pollTime,
    successExitCode = 0,
    logProcessResult = internalLogProcessResult,
  } = runOpts;

  if (!isNumber(successExitCode)) {
    throw new ProcessRerunError('Type', 'successExitCode should be a number');
  }

  return (cmd, index) =>
    new Promise(resolve => {
      const onErrorCloseHandler = null;

      const executionHolder = { stackTrace: '' };
      /**
       * @now this variable will be used for process kill if time more than @longestProcessTime
       */
      const startTime = +Date.now();

      if (currentExecutionVariable) {
        cmd = cmd.includes(currentExecutionVariable)
          ? cmd.replace(new RegExp(`${currentExecutionVariable}=\\d+`, 'ig'), `${currentExecutionVariable}=${index}`)
          : `${currentExecutionVariable}=${index} ${cmd}`;
      }
      const execProc = execute(cmd, logProcessResult, executionHolder, execOpts);

      const killTooLongExecution = procWhatShouldBeKilled => {
        const executionTime = +Date.now() - startTime;
        if (executionTime > longestProcessTime) {
          logger.info(`Process killed due to long time execution: ${millisecondsToMinutes(executionTime)}`);
          if (executionTime - longestProcessTime > 5000) {
            execProc.emit('exit', 100, 'PRO_RERUN_KILL');
            execProc.emit('close', 100, 'PRO_RERUN_KILL');
          } else {
            procWhatShouldBeKilled.kill();
          }
        }
      };

      const watcher = setInterval(() => killTooLongExecution(execProc), pollTime);

      execProc.on('exit', (code, signal) => {
        logger.info(`EXIT PROCESS: PID="${execProc.pid}", code="${code}" and signal="${signal}"`);
      });

      execProc.on('error', e => {
        logger.info(`ERROR PROCESS: PID="${execProc.pid}"`);
        logger.error(e);
      });

      execProc.on('close', async (code, signal) => {
        logger.info(`CLOSE PROCESS: PID="${execProc.pid}", code="${code}" and signal="${signal}"`);

        // clear watcher interval
        clearInterval(watcher);

        if (onErrorCloseHandler && (isFunction(onErrorCloseHandler) || isAsyncFunction(onErrorCloseHandler))) {
          await onErrorCloseHandler();
        }

        // if process code 0 - exit as a success result
        if (code === successExitCode) {
          return resolve(null);
        }

        // processResultAnalyzer - check that stack contains or not contains some specific data
        if (isFunction(processResultAnalyzer)) {
          const countInNotRetriableBeforeAnalyzation = notRetriable.length;

          const processResultAnalyzerResultCommandOrNull = processResultAnalyzer(
            cmd,
            executionHolder.stackTrace,
            notRetriable,
          );

          if (
            !processResultAnalyzerResultCommandOrNull &&
            countInNotRetriableBeforeAnalyzation === notRetriable.length
          ) {
            notRetriable.push(cmd);
          }
          return resolve(processResultAnalyzerResultCommandOrNull);
        }

        return resolve(cmd);
      });
    });
}

export { buildExecRunner };
