const {spawn} = require('child_process')
const {returnStringType} = require('./helpers')

function buildSpawnRunner(failedByAssert, runOpts) {

  const {
    addSpecificOptionsBeforeRun,
    longestProcessTime,
    debugProcess,
    reformatCommand,
    stackAnalize
  } = runOpts

  const executeCommandAsync = (cmd) => new Promise((resolve) => {
    let watcher = null
    let originalComman = null
    let originalCmd = cmd
    let specificCallBack = null
    let executionStack = ''

    /**
     * @now this variable will be used for process kill if time more than @longestProcessTime
     */
    const now = +Date.now()

    const killTooLongExecution = (proc) => {
      if(Date.now() - now >= longestProcessTime) {
        proc.kill()
      }
    }
    /**
     * @param {undefined|function} addSpecificOptions if function cmd will go to this function as argument
     */
    if(addSpecificOptionsBeforeRun) {
      const cmdObj = addSpecificOptionsBeforeRun(cmd)
      originalComman = {...cmd}
      cmd = cmdObj.cmd

      specificCallBack = cmdObj.cmdExecutableCB
    }

    if(debugProcess) {console.log(cmd)}

    const proc = spawn(cmd.command, cmd.args, cmd.options)

    watcher = setInterval(() => killTooLongExecution(proc), 5000)

    proc.on('exit', () => {clearInterval(watcher)})

    proc.stdout.on('data', (data) => {
      console.log(data.toString('utf8')); executionStack += data.toString()
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
        commandToRerun = reformatCommand(commandToRerun, executionStack)
      }
      // addSpecificOptionsBeforeRun was defined - we should remove useless opts what will be added in next iteration
      // if(additionalOpts) {
      // commandToRerun = commandToRerun.replace(additionalOpts, '')
      // }

      resolve(commandToRerun)
    })
  })
  return executeCommandAsync
}

module.exports = {
  buildSpawnRunner
}
