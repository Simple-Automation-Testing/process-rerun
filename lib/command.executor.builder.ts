import { buildExecRunner } from './exec.proc';

function buildCommandExecutor(notRetriable, runOpts) {
  return buildExecRunner(notRetriable, runOpts);
}

export { buildCommandExecutor };
