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
    longestTestTime,
    formCommanWithOption: addSpecificOptionsBeforeRun,
    currentExecutionVariable
  } = runOptions

  // maxSessionCount should be "let", because it will increment and decrement
  let {maxSessionCount} = runOptions

  /**
  * @param {string} cmd command what should be executed
  * @returns {Promise<string>|Promise<null>} return null if command executed successful or cmd if something went wrong
  */

  const executeCommandAsync = buildCommandExecutor({
    addSpecificOptionsBeforeRun,
    currentExecutionVariable,
    longestTestTime,
    debugProcess,
    addCommandOptionsAfterRun,
    stackAnalize
  })


  async function reRunner(commandsArray) {
    // if run arr was not defined as argument commandsArray will defined as default array
    commandsArray = (commandsArray || getSpecFilesPath(specsDir)
      .map((file) => getFormedRunCommand(file)))
      .filter(function(cmd) {return cmd.includes(grepWord)})

    const failedTests = await new Array(commandRunTriesCount)
      .fill(commandRunTriesCount)
      .reduce((resolver, /*current*/ current, index) => {
        return resolver.then((resolvedCommandsArray) => runCommandsArray(resolvedCommandsArray, [], index)
          .then((failedCommandsArray) => failedCommandsArray))
      }, Promise.resolve(commandsArray))

    /**
    * @param {Array} commands command array what should be executed
    * @param {Array} failedCommands array what will contains failed commands
    * @returns {void}
    */
    async function runCommand(commands, failedCommands) {
      if(maxSessionCount > currentSessionCount && commands.length) {
        currentSessionCount += 1
        const result = await executeCommandAsync(commands.splice(0, 1)[0]).catch(console.error);
        if(result) {failedCommands.push(result)}
        currentSessionCount -= 1
      }
    }

    async function runCommandsArray(commands, failedCommands, executionCount) {
      const asserter = setInterval(() => runCommand(commands, failedCommands, executionCount), intervalPoll);

      do {
        if(commands.length) {await runCommand(commands, failedCommands)}
        if(currentSessionCount) {await sleep(2000)}
      } while(commands.length || currentSessionCount)

      if(afterSingleRunCallBack && typeof afterSingleRunCallBack === 'function') {
        try {await afterSingleRunCallBack()} catch(e) {console.log(e)}
      }

      clearInterval(asserter)
      return failedCommands
    }

    console.log(failedTests.length, 'Failed test count')
    return [...failedTests, ...failedByAssert]
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
    longestTestTime = 450000,
    debugProcess = false,
    formCommanWithOption,
    pollTime = 1000,
    currentExecutionVariable
  }) => {

    const reformattedArgs = {
      formCommanWithOption,
      debugProcess,
      longestTestTime,
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
