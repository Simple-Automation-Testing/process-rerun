import {buildExecRunner} from './execProc'
// import {buildSpawnRunner} from './spawnProc';

function buildCommandExecutor(notRetriable, {spawn = false, ...runOpts}) {
  return buildExecRunner(notRetriable, runOpts)
  // TODO will be implemented
  // if (spawn) {
  //   return buildSpawnRunner(notRetriable, runOpts)
  // } else {
  // }
}

export {
  buildCommandExecutor
}
