/* eslint-disable sonarjs/cognitive-complexity */
/** biome-ignore-all lint/suspicious/noConsole: <explanation> */
import { isFunction, isAsyncFunction, isNumber, millisecondsToMinutes, isString, isBoolean } from 'sat-utils';
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
    killGraceTime = 5000,
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
      const onErrorCloseHandler: any = null;

      const executionHolder = { stackTrace: '' };
      /**
       * @now this variable will be used for process kill if time more than @longestProcessTime
       */
      const startTime = +Date.now();

      /**
       * kill escalation state:
       * 0 - nothing sent yet
       * 1 - SIGTERM sent (waiting for graceful exit)
       * 2 - SIGKILL sent (waiting for forced exit)
       * 3 - gave up, marked manually as killed (process may still be alive / unkillable)
       */
      let killStage = 0;
      let lastSignalAt = 0;

      if (currentExecutionVariable) {
        cmd = cmd.includes(currentExecutionVariable)
          ? cmd.replace(new RegExp(`${currentExecutionVariable}=\\d+`, 'ig'), `${currentExecutionVariable}=${index}`)
          : `${currentExecutionVariable}=${index} ${cmd}`;
      }
      const execProc = execute(cmd, logProcessResult, executionHolder, execOpts);

      /**
       * Send a signal to the whole detached process group (negative pid) so that
       * children spawned by the shell are reached too. Falls back to the direct
       * process handle on win32 or when the group is gone.
       */
      const signalProcess = (procWhatShouldBeKilled: typeof execProc, signal: NodeJS.Signals) => {
        try {
          if (process.platform !== 'win32' && procWhatShouldBeKilled.pid) {
            process.kill(-procWhatShouldBeKilled.pid, signal);
          } else {
            procWhatShouldBeKilled.kill(signal);
          }
        } catch (e) {
          // ESRCH - process group already exited between the alive-check and the kill call
          if ((e as NodeJS.ErrnoException).code !== 'ESRCH') {
            console.error(e);
          }
        }
      };

      const killTooLongExecution = (procWhatShouldBeKilled: typeof execProc) => {
        // process already exited - nothing to do
        if (procWhatShouldBeKilled.exitCode !== null || procWhatShouldBeKilled.signalCode !== null) {
          return;
        }
        const executionTime = +Date.now() - startTime;
        if (executionTime <= longestProcessTime) {
          return;
        }

        const now = +Date.now();

        // stage 0 -> 1: first timeout breach, ask politely with SIGTERM
        if (killStage === 0) {
          logger.info(`Process killed due to long time execution: ${millisecondsToMinutes(executionTime)}\n${cmd}`);
          signalProcess(procWhatShouldBeKilled, 'SIGTERM');
          killStage = 1;
          lastSignalAt = now;
          return;
        }

        // stage 1 -> 2: SIGTERM ignored for the grace period, force with SIGKILL
        if (killStage === 1 && now - lastSignalAt > killGraceTime) {
          logger.warn(`Process did not exit on SIGTERM, sending SIGKILL\n${cmd}`);
          signalProcess(procWhatShouldBeKilled, 'SIGKILL');
          killStage = 2;
          lastSignalAt = now;
          return;
        }

        // stage 2 -> 3: even SIGKILL did not reap it (uninterruptible sleep / re-parented
        // session that escaped the group). Give up and mark as killed so the runner can
        // proceed - the OS process may still be alive and now orphaned.
        if (killStage === 2 && now - lastSignalAt > killGraceTime) {
          procWhatShouldBeKilled.emit('exit', 100, 'PRO_RERUN_KILL');
          procWhatShouldBeKilled.emit('close', 100, 'PRO_RERUN_KILL');
          killStage = 3;
          logger.error(`Process survived SIGKILL and was marked manually as killed - it may still be running`);
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
