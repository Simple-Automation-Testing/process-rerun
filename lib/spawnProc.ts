import {spawn} from 'child_process';
import {returnStringType} from './helpers';

function buildSpawnRunner(notRetriable, runOpts) {

  const {
    formCommanWithOption,
    longestProcessTime,
    debugProcess,
    processResultAnalyzer
  } = runOpts

  const executeCommandAsync = (cmd) => new Promise((resolve) => {

    let watcher = null
    let originalComman = null
    let originalCmd = cmd
    let onErrorCloseHandler = null
    let executionStack = ''

    /**
     * @now this variable will be used for process kill if time more than @longestProcessTime
     */
    const now = +Date.now()

    const killTooLongExecution = (proc) => {
      if (Date.now() - now >= longestProcessTime) {
        proc.kill()
      }
    }
    /**
     * @param {undefined|function} addSpecificOptions if function cmd will go to this function as argument
     */
    if (formCommanWithOption) {
      const cmdObj = formCommanWithOption(cmd)
      originalComman = {...cmd}
      cmd = cmdObj.cmd

      onErrorCloseHandler = cmdObj.cmdExecutableCB
    }

    if (debugProcess) {console.log(cmd)}

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

      if (debugProcess) {console.log(executionStack, code)}

      // if process code 0 - exit as a success result
      if (code === 0) {
        resolve(commandToRerun); return
      }
      // processResultAnalyzer - check that stack contains or not contains some specific data
      if (code !== 0 && processResultAnalyzer && processResultAnalyzer(executionStack)) {
        commandToRerun = cmd
      } else {
        notRetriable.push(cmd)
      }

      // if code === 0 do nothing, success
      if (onErrorCloseHandler) {
        if (onErrorCloseHandler.then || returnStringType(onErrorCloseHandler) === '[object AsyncFunction]') {
          await onErrorCloseHandler()
        } else {
          onErrorCloseHandler()
        }
      }

      // formCommanWithOption was defined - we should remove useless opts what will be added in next iteration
      // if(additionalOpts) {
      // commandToRerun = commandToRerun.replace(additionalOpts, '')
      // }

      resolve(commandToRerun)
    })
  })
  return executeCommandAsync
}

export {
  buildSpawnRunner
}
