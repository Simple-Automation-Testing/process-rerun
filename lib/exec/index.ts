import { isString, getType, isObject, isFunction } from 'sat-utils';
import { exec } from 'child_process';
import { ProcessRerunError } from '../error';

function execute(cmd: string, logProcessResult, executionHolder: { stackTrace: string }, execOpts = {}) {
  if (!isString(cmd)) {
    throw new ProcessRerunError('Type', `cmd (first argument should be a string), current type is ${getType(cmd)}`);
  }
  if (!isObject(executionHolder)) {
    throw new ProcessRerunError(
      'Type',
      `executionHolder (third argument should be an object), current type is ${getType(executionHolder)}`,
    );
  }
  if (!isFunction(logProcessResult)) {
    throw new ProcessRerunError(
      'Type',
      `executionHolder (second argument should be a function), current type is ${getType(logProcessResult)}`,
    );
  }

  const startTime = +Date.now();

  const execProc = exec(cmd, execOpts, (error, stdout, stderr) => {
    logProcessResult(cmd, startTime, execProc, error, stdout, stderr);

    executionHolder.stackTrace += `${stdout}${stderr}`;
  });

  return execProc;
}

export { execute };
