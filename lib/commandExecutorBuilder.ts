import {buildExecRunner} from './execProc';

function buildCommandExecutor(notRetriable, {spawn = false, ...runOpts}) {
  return buildExecRunner(notRetriable, runOpts);
}

export {
  buildCommandExecutor
}
