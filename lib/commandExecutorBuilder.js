const {exec} = require('child_process')
const {returnStringType} = require('./helpers')

function buildCommandExecutor(failedByAssert, runOpts) {

  const {
    addSpecificOptionsBeforeRun,
    currentExecutionVariable,
    longestProcessTime,
    debugProcess,
    addCommandOptionsAfterRun,
    stackAnalize
  } = runOpts


  const executeCommandAsync = (cmd, index) => new Promise((resolve) => {
    console.log(addSpecificOptionsBeforeRun)
    let watcher = null
    let additionalOpts = null
    let originalCmd = cmd
    let specificCallBack = null
    let killTooLongExecution = null
    let executionStack = ''

    /**
     * @now this variable will be used for process kill if time more than @longestProcessTime
     */
    const now = +Date.now()

    /**
     * @param {undefined|function} addSpecificOptions if function cmd will go to this function as argument
     */
    if(addSpecificOptionsBeforeRun) {
      const cmdObj = addSpecificOptionsBeforeRun(cmd)
      cmd = cmdObj.cmd
      specificCallBack = cmdObj.cmdExecutableCB
      additionalOpts = cmd.replace(originalCmd, '')
    }

    if(currentExecutionVariable) {
      if(cmd.includes(currentExecutionVariable)) {
        cmd = cmd.replace(new RegExp(`${currentExecutionVariable}=\\d+`, 'ig'), `${currentExecutionVariable}=${index}`)
      } else {
        cmd = `${currentExecutionVariable}=${index} ${cmd}`
      }
    }

    if(debugProcess) {console.log(cmd)}

    const proc = exec(cmd)

    killTooLongExecution = () => {
      if(+Date.now() - now > longestProcessTime) {
        clearInterval(watcher)
        proc.kill()
        resolve(cmd)
      }
    };

    watcher = setInterval(killTooLongExecution, 5000)

    proc.on('exit', () => {clearInterval(watcher)})

    proc.stdout.on('data', (data) => {
      (debugProcess) && console.log(data.toString('utf8')); executionStack += data.toString()
    })
    proc.stderr.on('data', (data) => console.log(data.toString('utf8')))
    proc.on('error', (e) => {console.error(e)})

    proc.on('close', async (code) => {

      let commandToRerun = null

      if(debugProcess) {console.log(executionStack, code)}

      // if process code 0 - exit as a success result
      if(code === 0) {
        resolve(commandToRerun); return
      }
      // stackAnalize - check that stack contains or not contains some specific data
      if(code !== 0 && stackAnalize && stackAnalize(executionStack)) {
        commandToRerun = cmd
      } else if(code !== 0 && addCommandOptionsAfterRun) {
        commandToRerun = cmd
      } else {
        failedByAssert.push(cmd)
      }

      // if code === 0 do nothing, success
      if(specificCallBack) {
        if(specificCallBack.then || returnStringType(specificCallBack) === '[object AsyncFunction]') {
          await specificCallBack()
        } else {
          specificCallBack()
        }
      }
      if(addCommandOptionsAfterRun && commandToRerun) {
        commandToRerun = addCommandOptionsAfterRun(commandToRerun, executionStack)
      }
      if(additionalOpts) {

      }

      resolve(commandToRerun)
    })
  })
  return executeCommandAsync
}

module.exports = {
  buildCommandExecutor
}
