import { isString, getType, isObject, isFunction } from 'sat-utils';
import { spawn } from 'node:child_process';
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
  let stdout = '';
  let stderr = '';
  let settled = false;

  const execProc = spawn(cmd, { ...execOpts, shell: true });

  execProc.stdout?.on('data', chunk => {
    stdout += chunk.toString();
  });
  execProc.stderr?.on('data', chunk => {
    stderr += chunk.toString();
  });

  const finalize = (error: Error | null) => {
    if (settled) return;
    settled = true;
    logProcessResult(cmd, startTime, execProc, error, stdout, stderr);
    executionHolder.stackTrace += `${stdout}${stderr}`;
  };

  execProc.on('error', finalize);
  execProc.on('close', (code, signal) => {
    const error =
      code !== 0 && code !== null
        ? Object.assign(new Error(`Command failed: ${cmd}`), { code, signal })
        : null;
    finalize(error);
  });

  return execProc;
}

export { execute };
