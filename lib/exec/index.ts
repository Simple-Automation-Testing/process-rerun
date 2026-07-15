import { spawn } from 'node:child_process';

import { isString, getType, isObject, isFunction } from 'sat-utils';
import { ProcessRerunError } from '../error';

/**
 * Extracts every shared cache payload emitted by the child process on its stdout.
 *
 * A process can publish data back to the runner by printing one or more lines shaped like:
 *   shared-cache: "<json payload here>"
 *
 * Each json payload lives inside the double quotes with its own quotes escaped.
 * Returns an array with one parsed payload per matched line (empty when none are present),
 * preserving the order in which the process printed them.
 */
function getCache(output: string): unknown[] {
  if (!isString(output)) return [];

  const entries: unknown[] = [];
  for (const match of output.matchAll(/shared-cache:\s*"((?:\\.|[^"\\])*)"/g)) {
    const raw = match[1];
    try {
      // `raw` is the body of a JSON string literal (inner quotes escaped),
      // so decode it first, then parse the decoded json payload.
      const decoded = JSON.parse(`"${raw}"`);
      try {
        entries.push(JSON.parse(decoded));
      } catch {
        entries.push(decoded);
      }
    } catch {
      entries.push(raw);
    }
  }

  return entries;
}

function execute({
  cmd,
  logProcessResult,
  executionHolder,
  execOpts = {},
}: {
  cmd: string;
  logProcessResult;
  executionHolder: { stackTrace: string; cache?: unknown[] };
  execOpts?: object;
}) {
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

  const execProc = spawn(cmd, { ...execOpts, shell: true, detached: process.platform !== 'win32' });

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
    // collect every shared-cache line the process printed over its whole lifetime
    executionHolder.cache = getCache(stdout);
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

export { execute, getCache };
