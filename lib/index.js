const {buildCommandExecutor} = require('./commandExecutorBuilder')
const {sleep, getFormedRunCommand, getSpecFilesPath, getPollTime} = require('./helpers')

function reRunnerBuilder(runOptions) {

  const failedByAssert = []
  let currentSessionCount = 0

  const {
    stackAnalize,
    specRerunCount: commandRunTriesCount,
    grepWord,
    debugProcess,
    reformatCommand: addCommandOptionsAfterRun,
    intervalPoll,
    everyCycleCallback: afterSingleRunCallBack,
    specsDir,
    longestProcessTime,
    formCommanWithOption: addSpecificOptionsBeforeRun,
    currentExecutionVariable
  } = runOptions

  // maxSessionCount should be "let", because it will increment and decrement
  let {maxSessionCount} = runOptions

  /**
  * @param {string} cmd command what should be executed
  * @returns {Promise<string>|Promise<null>} return null if command executed successful or cmd if something went wrong
  */

  const executeCommandAsync = buildCommandExecutor(failedByAssert, {
    addSpecificOptionsBeforeRun,
    currentExecutionVariable,
    longestProcessTime,
    debugProcess,
    addCommandOptionsAfterRun,
    stackAnalize
  })


  async function reRunner(commandsArray) {
    // if run arr was not defined as argument commandsArray will defined as default array
    commandsArray = (commandsArray || getSpecFilesPath(specsDir)
      .map((file) => getFormedRunCommand(file)))
      .filter(function(cmd) {return cmd.includes(grepWord)})

    const failedCommands = await new Array(commandRunTriesCount)
      // create array with current length
      .fill(commandRunTriesCount)
      // execute run
      .reduce((resolver, /*current*/ current, index) => {

        return resolver.then((resolvedCommandsArray) => {

          return runCommandsArray(resolvedCommandsArray, [], index)

            .then((failedCommandsArray) => {
              return failedCommandsArray
            })
        })
      }, Promise.resolve(commandsArray))

    /**
    * @param {Array} commands command array what should be executed
    * @param {Array} failedCommands array what will contains failed commands
    * @returns {void}
    */

    async function runCommand(commands, failedCommands, runIndex) {
      if(maxSessionCount > currentSessionCount && commands.length) {
        currentSessionCount += 1
        const result = await executeCommandAsync(commands.splice(0, 1)[0], runIndex).catch(console.error)
        if(result) {
          failedCommands.push(result)
        }
        currentSessionCount -= 1
      }
    }

    async function runCommandsArray(commands, failedCommands, executionCount) {
      const asserter = setInterval(() => runCommand(commands, failedCommands, executionCount), intervalPoll);

      do {
        if(commands.length) {await runCommand(commands, failedCommands, executionCount)}
        if(currentSessionCount) {await sleep(2000)}
      } while(commands.length || currentSessionCount)

      if(afterSingleRunCallBack && typeof afterSingleRunCallBack === 'function') {
        try {await afterSingleRunCallBack()} catch(e) {console.log(e)}
      }

      clearInterval(asserter)
      return failedCommands
    }

    const combinedFailedProcesses = [...failedCommands, ...failedByAssert]

    console.log(combinedFailedProcesses.length, 'Failed test count')

    return combinedFailedProcesses
  }

  return reRunner
}


module.exports = {
  buildExeRun: ({
    maxSessionCount = 5,
    specRerunCount = 2,
    stackAnalize,
    everyCycleCallback,
    reformatCommand,
    grepWord = '',
    longestProcessTime = 450000,
    debugProcess = false,
    formCommanWithOption,
    pollTime = 1000,
    currentExecutionVariable
  } = {}) => {

    const reformattedArgs = {
      formCommanWithOption,
      debugProcess,
      longestProcessTime,
      maxSessionCount,
      specRerunCount,
      reformatCommand,
      stackAnalize,
      grepWord,
      currentExecutionVariable,
      everyCycleCallback,
      intervalPoll: getPollTime(pollTime)
    };

    return reRunnerBuilder(reformattedArgs)
  },
  sleep,
  walkSync: getSpecFilesPath,
  getRunCommand: getFormedRunCommand
}
