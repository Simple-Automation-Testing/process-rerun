/* eslint-disable sonarjs/cognitive-complexity */
import { isFunction, isAsyncFunction, isNumber, millisecondsToMinutes, isString, isBoolean, sleep } from 'sat-utils';
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
    onExitCloseProcess,
    onErrorProcess,
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

      const killTooLongExecution = (procWhatShouldBeKilled: typeof execProc) => {
        const executionTime = +Date.now() - startTime;
        if (executionTime > longestProcessTime) {
          if (executionTime - longestProcessTime > 7500) {
            procWhatShouldBeKilled.emit('exit', 100, 'PRO_RERUN_KILL');
            procWhatShouldBeKilled.emit('close', 100, 'PRO_RERUN_KILL');
            logger.error(`Process just marked manually as killed but it is possible that it is still running`);
          } else {
            logger.info(`Process killed due to long time execution: ${millisecondsToMinutes(executionTime)}\n${cmd}}`);
            process.kill(procWhatShouldBeKilled.pid);
          }
        }
      };

      const watcher = setInterval(() => killTooLongExecution(execProc), pollTime);

      if (onExitCloseProcess) {
        execProc.on('exit', (code, signal) => onExitCloseProcess(execProc, code, signal));
      }

      if (onErrorProcess) {
        execProc.on('error', error => onErrorProcess(execProc, error));
      }

      execProc.on('close', async (code, signal) => {
        if (onExitCloseProcess) {
          onExitCloseProcess(execProc, code, signal);
        }

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

          const analyzationResult = processResultAnalyzer(cmd, executionHolder.stackTrace, notRetriable);

          if (!isString(analyzationResult) && !isBoolean(analyzationResult)) {
            logger.warn('processResultAnalyzer should return boolean or string');
          }

          // if analyzationResult is string - we want to re-execute command
          if (isString(analyzationResult)) {
            return resolve(analyzationResult);
          }

          // if analyzationResult is true - we make assumption that process was finished successfully
          if (isBoolean(analyzationResult) && analyzationResult) {
            return resolve(null);
          }

          if (
            countInNotRetriableBeforeAnalyzation === notRetriable.length ||
            (isBoolean(analyzationResult) && !analyzationResult)
          ) {
            notRetriable.push(cmd);
          }

          return resolve(null);
        }

        return resolve(cmd);
      });
    });
}

export { buildExecRunner };
