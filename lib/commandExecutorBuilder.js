const {exec} = require('child_process')

function buildCommandExecutor(runOpts) {

  const {
    addSpecificOptionsBeforeRun,
    currentExecutionVariable,
    longestTestTime,
    debugProcess,
    addCommandOptionsAfterRun,
    stackAnalize
  } = runOpts

  const executeCommandAsync = (cmd, index) => new Promise((resolve) => {

    let specificCallBack = null
    let executionStack = ''

    /**
     * @param {undefined|function} addSpecificOptions if function cmd will go to this function as argument
     */
    if(addSpecificOptionsBeforeRun) {
      const cmdObj = addSpecificOptionsBeforeRun(cmd)
      cmd = cmdObj.cmd
      specificCallBack = cmdObj.cmdExecutableCB
    }

    if(currentExecutionVariable) {
      if(cmd.includes(currentExecutionVariable)) {
        cmd = cmd.replace(new RegExp(`${currentExecutionVariable}=\\d`, 'ig'), `${currentExecutionVariable}=${index}`)
      } else {
        cmd = `${currentExecutionVariable}=${index} ${cmd}`
      }
    }

    if(debugProcess) {console.log(cmd)}

    const now = +Date.now()
    const proc = exec(cmd)

    const killTooLongExecution = () => {if(+Date.now() - now > longestTestTime) {clearInterval(watcher); proc.kill(); resolve(cmd)} };

    const watcher = setInterval(killTooLongExecution, 15000)

    proc.on('exit', () => {clearInterval(watcher)})

    proc.stdout.on('data', (data) => {
      (debugProcess) && console.log(data.toString('utf8')); executionStack += data.toString()
    })
    proc.stderr.on('data', (data) => console.log(data.toString('utf8')))
    proc.on('error', (e) => {console.error(e)})

    proc.on('close', (code) => {
      if(debugProcess) {console.log(executionStack, code)}
      let commandToRerun = null
      // stackAnalize - check that stack contains or not contains some specific data
      if(code !== 0 && stackAnalize && stackAnalize(executionStack)) {
        commandToRerun = cmd
      } else {
        if(code !== 0) {failedByAssert.push(cmd)}
      }
      // if code === 0 do nothing, success
      if(specificCallBack) {
        console.log('here in cmd Callback')
        specificCallBack()
      }
      if(addCommandOptionsAfterRun && commandToRerun) {
        commandToRerun = addCommandOptionsAfterRun(commandToRerun, executionStack)
      }
      resolve(commandToRerun)
    })
  })
  return executeCommandAsync
}

module.exports = {
  buildCommandExecutor
}
