const {exec, fork} = require('child_process')
const {sleep, getRunCommand, walkSync, getPollTime} = require('./helpers')

function buildScope(runOptions) {
  const failedByAssert = []
  let currentSessionCount = 0
  const {stackAnalize, specRerunCount, grepWord, debugProcess, reformatCommand} = runOptions
  const {intervalPoll, everyCycleCallback, specsDir, longestTestTime, formCommanWithOption} = runOptions

  // maxSessionCount should be "let", because it will increment and decrement
  let {maxSessionCount} = runOptions

  /**
  * @param {string} cmd command what should be executed
  * @returns {Promise<string>|Promise<null>} return null if command executed successful or cmd if something went wrong
  */
  const runPromise = (cmd) => new Promise((res) => {

    let cmdCB = null
    let fullStack = ''

    /**
     * @param {undefined|function} formCommanWithOption if funtion cmd will go to this function as argument
     */
    if(formCommanWithOption) {
      const cmdObj = formCommanWithOption(cmd)
      cmd = cmdObj.cmd
      cmdCB = cmdObj.cmdExecutableCB
    }

    if(debugProcess) {console.log(cmd)}

    const now = +Date.now();
    const proc = exec(cmd)
    const watcher = setInterval(() => {if(+Date.now() - now > longestTestTime) {clearInterval(watcher); proc.kill(); res(cmd)} }, 15000)

    proc.on('exit', () => {clearInterval(watcher)})

    proc.stdout.on('data', (data) => {
      (debugProcess) && console.log(data.toString('utf8')); fullStack += data.toString()
    })
    proc.stderr.on('data', (data) => console.log(data.toString('utf8')))
    proc.on('error', (e) => {console.error(e)})

    proc.on('close', (code) => {
      if(debugProcess) {console.log(fullStack, code)}
      let execResult = null
      // stackAnalize - assert function
      if(code !== 0 && stackAnalize(fullStack)) {
        execResult = cmd
      } else {
        // if code 0 - success, if not 0 failed
        if(code !== 0) {failedByAssert.push(cmd)}
      }
      if(cmdCB) {
        console.log('here in cmd CB')
        cmdCB()
      }
      if(reformatCommand && execResult) {
        execResult = reformatCommand(execResult, fullStack)
      }
      res(execResult)
    })
  })


  async function exeRun(runArr) {
    // if run arr was not defined as argument runArr will defined as default array
    runArr = (runArr || walkSync(specsDir).map((file) => getRunCommand(file))).filter(function(cmd) {return cmd.includes(grepWord)})

    const failedTests = await new Array(specRerunCount).fill(specRerunCount).reduce((resolver) => {
      return resolver.then((resolvedArr) => performRun(resolvedArr, []).then((failedArr) => failedArr))
    }, Promise.resolve(runArr))

    /**
    * @param {Array} runnCommandsArr command array what should be executed
    * @param {Array} failedArr array what will contains failed commands
    * @returns {void}
    */
    async function runCommandsArr(runnCommandsArr, failedArr) {
      if(maxSessionCount > currentSessionCount && runnCommandsArr.length) {
        currentSessionCount += 1
        const result = await runPromise(runnCommandsArr.splice(0, 1)[0]).catch(console.error)
        if(result) {failedArr.push(result)}
        currentSessionCount -= 1
      }
    }

    async function performRun(runSuits, failedRun) {
      const asserter = setInterval(() => runCommandsArr(runSuits, failedRun), intervalPoll)

      do {
        if(runSuits.length) {await runCommandsArr(runSuits, failedRun)}
        if(currentSessionCount) {await sleep(2000)}
      } while(runSuits.length || currentSessionCount)

      if(everyCycleCallback && typeof everyCycleCallback === 'function') {
        try {await everyCycleCallback()} catch(e) {console.log(e)}
      }

      clearInterval(asserter)
      return failedRun
    }

    console.log(failedTests.length, 'Failed test count')
    return [...failedTests, ...failedByAssert]
  }

  return exeRun
}


module.exports = {
  walkSync,
  sleep,
  buildExeRun: ({
    maxSessionCount = 5, specRerunCount = 2, stackAnalize = (stack) => true,
    everyCycleCallback = async () => true, reformatCommand = undefined,
    grepWord = '', longestTestTime = 450000, debugProcess = false,
    formCommanWithOption = undefined, pollTime = 1000
  }) => {

    const reformatedArg = {
      formCommanWithOption,
      debugProcess,
      longestTestTime,
      maxSessionCount,
      specRerunCount,
      reformatCommand,
      stackAnalize,
      grepWord,
      everyCycleCallback,
      intervalPoll: getPollTime(pollTime)
    }

    return buildScope(reformatedArg)
  },
  getRunCommand
}
