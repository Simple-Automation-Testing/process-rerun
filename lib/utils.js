function executionWatcher(debugProcess, currentTime, limitTime, intervalWatcher, processWhatShouldBeKilled, resolver, resolverArg) {
  if(+Date.now() - currentTime > limitTime) {
    if(debugProcess) {
      console.log('_______________________________________________________________ \n')
      console.log('Process what was started just was killed \n')
      console.log('Command is: ', cmd)
      console.log('_______________________________________________________________ \n')
    }

    clearInterval(intervalWatcher)

    if(processWhatShouldBeKilled) {
      processWhatShouldBeKilled.kill()
    }
    if(resolver) {
      resolver(resolverArg)
    }
  }
};

module.exports = {
  executionWatcher
}