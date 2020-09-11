import {buildExecRunner} from './execProc';

function buildCommandExecutor(notRetriable, runOpts) {
  return buildExecRunner(notRetriable, runOpts);
}

export {
  buildCommandExecutor
};
