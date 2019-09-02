const {exec} = require('child_process')
const {returnStringType} = require('./helpers')

function buildExecRunner(failedByAssert, runOpts) {

  const {
    addSpecificOptionsBeforeRun,
    currentExecutionVariable,
    longestProcessTime,
    debugProcess,
    reformatCommand,
    stackAnalize,
    execOpts = {maxBuffer: 1000 * 1024}
  } = runOpts

  const executeCommandAsync = (cmd, index) => new Promise((resolve) => {
    let execProc = null

    let additionalOpts = null
    let originalCmd = cmd
    let specificCallBack = null
    let executionStack = ''

    /**
     * @now this variable will be used for process kill if time more than @longestProcessTime
     */
    const startTime = +Date.now()

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

    execProc = exec(cmd, execOpts, (error, stdout, stderr) => {
      if(debugProcess) {
        console.log('___________________________________________________________________________')
        console.log(`command for process:  ${cmd}`)
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
        console.error(`error ${error}`)
        console.log('___________________________________________________________________________')
      }

      executionStack += `${stdout}${stderr}`
    })


    const killTooLongExecution = (procWhatShouldBekilled) => {
      if(+Date.now() - startTime > longestProcessTime) {
        procWhatShouldBekilled.kill()
      }
    }

    const watcher = setInterval(() => killTooLongExecution(execProc), 5000)

    execProc.on('exit', () => {
      if(debugProcess) {
        console.log('EXIT PROCESS')
      }
    })

    execProc.on('close', () => {
      if(debugProcess) {
        console.log('CLOSE PROCESS')
      }
      clearInterval(watcher)
    })

    execProc.on('error', (e) => {console.error(e)})

    execProc.on('close', async (code) => {
      // clear watcher interval
      clearInterval(watcher)

      let commandToRerun = null


      // if process code 0 - exit as a success result
      if(code === 0) {
        resolve(commandToRerun); return
      }
      // stackAnalize - check that stack contains or not contains some specific data
      if(code !== 0 && stackAnalize && stackAnalize(executionStack)) {
        commandToRerun = cmd
      } else if(code !== 0 && reformatCommand) {
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

      if(reformatCommand && commandToRerun) {
        commandToRerun = reformatCommand(commandToRerun, executionStack, failedByAssert)
      }
      // addSpecificOptionsBeforeRun was defined - we should remove useless opts what will be added in next iteration
      if(additionalOpts) {
        commandToRerun = commandToRerun.replace(additionalOpts, '')
      }

      resolve(commandToRerun)
    })
  })
  return executeCommandAsync
}

module.exports = {
  buildExecRunner
}


const a = `IT_TITLE:[Upload product offer]
E/launcher - Process exited with error code 1
`