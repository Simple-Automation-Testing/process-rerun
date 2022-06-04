import { logger } from './logger';
import { millisecondsToMinutes } from './utils';

function internalLogStartCycle(maxThreads: number | string, attemptsCount: number | string, inTimeCommands: string[]) {
  logger.info(`Threads count is: ${maxThreads}`);
  logger.info(`Commands count: ${inTimeCommands.length}`);
  logger.info(`Attempts count is: ${attemptsCount}`);
}

function internalLogEndCycle(retriable: string[], notRetriable: string[], startTime: number) {
  logger.info('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
  logger.info('Failed processes count:', retriable.length + notRetriable.length);
  logger.info('Not retriable processes count:', notRetriable.length);
  logger.info('Retriable processes count:', retriable.length);
  logger.info(`Execution time: ${(Date.now() - startTime) / 1000} seconds`);
  logger.info('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
}

function internalLogIteractionCycle(cycleNumber: number, commands: string[]) {
  logger.info('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
  logger.info(`Execution cycle: ${cycleNumber}`);
  logger.info('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
  logger.info('=========================================================================');
  logger.info(`Processes count: ${commands.length}`);
  logger.info('=========================================================================');
}

function internalLogMiddleResultsCycle(initialCount: number, commands: string[]) {
  logger.info('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
  logger.info(`initial processes quantity ${initialCount}`);
  logger.info(`in progress ${commands.length}`);
  logger.info('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
}

function internalLogIntimeCommand(commadData: { cmd: string; attemptsCount: number }) {
  logger.info('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
  logger.info(`command ${commadData.cmd} failed`);
  logger.info(`attempts count for command is ${commadData.attemptsCount}`);
  logger.info('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
}

function internalLogProcessResult(cmd: string, startTime: number, execProc, error, stdout, stderr) {
  logger.info('___________________________________________________________________________');
  logger.info(`command for process:  ${cmd}`);
  logger.info(`process duration: ${millisecondsToMinutes(+Date.now() - startTime)}`);
  logger.info(`PID: ${execProc.pid}`);
  logger.info(`stdout: ${stdout}`);
  if (stderr) logger.error(`stderr: ${stderr}`);
  if (error) logger.error(`error: ${error}`);
  logger.info('___________________________________________________________________________');
}

export {
  internalLogStartCycle,
  internalLogEndCycle,
  internalLogIteractionCycle,
  internalLogMiddleResultsCycle,
  internalLogIntimeCommand,
  internalLogProcessResult,
};
