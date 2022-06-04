import { logger } from './logger';

function executionWatcher(
  currentTime,
  limitTime,
  intervalWatcher,
  processWhatShouldBeKilled,
  resolver,
  resolverArg,
  cmd,
) {
  if (+Date.now() - currentTime > limitTime) {
    logger.log('_______________________________________________________________ \n');
    logger.log('Process what was started just was killed \n');
    logger.log('Command is: ', cmd);
    logger.log('_______________________________________________________________ \n');

    clearInterval(intervalWatcher);

    if (processWhatShouldBeKilled) {
      processWhatShouldBeKilled.kill();
    }
    if (resolver) {
      resolver(resolverArg);
    }
  }
}

export { executionWatcher };
