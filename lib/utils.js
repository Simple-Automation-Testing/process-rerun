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

function millisecondsToMinutes(milliseconds) {
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = ((milliseconds % 60000) / 1000).toFixed(0);
  return (seconds === '60' ? (minutes + 1) + ":00" : minutes + ":" + (seconds < 10 ? "0" : "") + seconds);
}

module.exports = {
  executionWatcher,
  millisecondsToMinutes
}