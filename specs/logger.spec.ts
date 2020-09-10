import {expect} from 'assertior';
import {logger, setLogLevel} from '../lib/logger';
import {mockConsoleApi} from './__utils__';

test('[P] ERROR', function() {
  const mocked = mockConsoleApi();
  setLogLevel('ERROR');
  logger.log(1);
  logger.info(1);
  logger.warn(1);
  logger.error(1);
  expect(mocked.getErrCalls()).toEqual(1);
  expect(mocked.getWarnCalls()).toEqual(0);
  expect(mocked.getInfoCalls()).toEqual(0);
  expect(mocked.getLogCalls()).toEqual(0);
  mocked.restore();
});

test('[P] WARNING', function() {
  const mocked = mockConsoleApi();
  setLogLevel('WARN');
  logger.log(1);
  logger.info(1);
  logger.warn(1);
  logger.error(1);
  expect(mocked.getErrCalls()).toEqual(1);
  expect(mocked.getWarnCalls()).toEqual(1);
  expect(mocked.getInfoCalls()).toEqual(0);
  expect(mocked.getLogCalls()).toEqual(0);
  mocked.restore();
});

test('[P] INFO', function() {
  const mocked = mockConsoleApi();
  setLogLevel('INFO');
  logger.log(1);
  logger.info(1);
  logger.warn(1);
  logger.error(1);
  expect(mocked.getErrCalls()).toEqual(1);
  expect(mocked.getWarnCalls()).toEqual(1);
  expect(mocked.getInfoCalls()).toEqual(1);
  expect(mocked.getLogCalls()).toEqual(0);
  mocked.restore();
});

test('[P] VERBOSE', function() {
  const mocked = mockConsoleApi();
  setLogLevel('VERBOSE');
  logger.log(1);
  logger.info(1);
  logger.warn(1);
  logger.error(1);
  expect(mocked.getErrCalls()).toEqual(1);
  expect(mocked.getWarnCalls()).toEqual(1);
  expect(mocked.getInfoCalls()).toEqual(1);
  expect(mocked.getLogCalls()).toEqual(1);
  mocked.restore();
});

test('[P] SWHITCH LOG LEVELS', function() {
  const mocked = mockConsoleApi();
  setLogLevel('ERROR');
  logger.log(1);
  logger.info(1);
  logger.warn(1);
  logger.error(1);
  expect(mocked.getErrCalls()).toEqual(1);
  expect(mocked.getWarnCalls()).toEqual(0);
  expect(mocked.getInfoCalls()).toEqual(0);
  expect(mocked.getLogCalls()).toEqual(0);
  setLogLevel('VERBOSE');
  logger.log(1);
  logger.info(1);
  logger.warn(1);
  logger.error(1);
  expect(mocked.getErrCalls()).toEqual(2);
  expect(mocked.getWarnCalls()).toEqual(1);
  expect(mocked.getInfoCalls()).toEqual(1);
  expect(mocked.getLogCalls()).toEqual(1);

  mocked.restore();
});
