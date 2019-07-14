const {buildExecRunner} = require('./execProc')
const {buildSpawnRunner} = require('./spawnProc')

function buildCommandExecutor(failedByAssert, {spawn = false, ...runOpts}) {
  if(spawn) {
    return buildSpawnRunner(failedByAssert, runOpts)
  } else {
    return buildExecRunner(failedByAssert, runOpts)
  }
}

module.exports = {
  buildCommandExecutor
}
