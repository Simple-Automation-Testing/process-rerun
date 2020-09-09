import {exec} from 'child_process';
import {millisecondsToMinutes} from '../utils'
import {logger} from '../logger';
import {ProcessRerunError} from '../error';

function execute(cmd: string, executionHolder: {stackTrace: string}, execOpts = {}, debugProcess) {
  const startTime = +Date.now();
  if ((typeof cmd) !== 'string') {
    throw new ProcessRerunError('Type', `cmd (first argument should be a string), current type is ${typeof cmd}`);
  }
  if ((typeof executionHolder) !== 'object') {
    throw new ProcessRerunError('Type', `executionHolder (second argument should be an object), current type is ${typeof executionHolder}`);
  }
  if (executionHolder === null) {
    throw new ProcessRerunError('Type', `executionHolder (second argument should be an object), current type is null`);
  }

  const execProc = exec(cmd, execOpts, (error, stdout, stderr) => {

    logger.info('___________________________________________________________________________');
    logger.info(`command for process:  ${cmd}`);
    logger.info(`process duration: ${millisecondsToMinutes(+Date.now() - startTime)}`);
    logger.info(`PID: ${execProc.pid}`);
    logger.info(`stdout: ${stdout}`);
    if (stderr) logger.error(`stderr: ${stderr}`);
    if (error) logger.error(`error: ${error}`);
    logger.info('___________________________________________________________________________');

    executionHolder.stackTrace += `${stdout}${stderr}`;
  });

  return execProc;
}

export {
  execute
}