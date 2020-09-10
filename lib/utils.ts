import {logger} from './logger';

function executionWatcher(currentTime, limitTime, intervalWatcher, processWhatShouldBeKilled, resolver, resolverArg, cmd) {
  if (+Date.now() - currentTime > limitTime) {

    logger.log('_______________________________________________________________ \n')
    logger.log('Process what was started just was killed \n')
    logger.log('Command is: ', cmd)
    logger.log('_______________________________________________________________ \n')

    clearInterval(intervalWatcher)

    if (processWhatShouldBeKilled) {
      processWhatShouldBeKilled.kill()
    }
    if (resolver) {
      resolver(resolverArg)
    }
  }
};

function millisecondsToMinutes(milliseconds): string {
  const minutes = Math.floor(milliseconds / 60000) as number;
  const seconds = ((milliseconds % 60000) / 1000).toFixed(0);
  return (seconds === '60' ? (minutes + 1) + ":00" : minutes + ":" + (+seconds < 10 ? "0" : "") + seconds);
}

export {
  executionWatcher,
  millisecondsToMinutes,
}