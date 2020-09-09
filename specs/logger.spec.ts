import {expect} from 'assertior';
import {logger, setLogLevel} from '../lib/logger';

function mockConsoleApi() {
  let callLog = 0;
  let callInfo = 0;
  let callWarn = 0;
  let callErr = 0;

  const orLog = console.log;
  const orInfo = console.info;
  const orWarn = console.warn;
  const orErr = console.error;

  console.log = function() {
    callLog++;
  };

  console.info = function() {
    callInfo++;
  }

  console.warn = function() {
    callWarn++;
  }

  console.error = function() {
    callErr++;
  }

  return {
    restore() {
      console.log = orLog.bind(console);
      console.info = orInfo.bind(console);
      console.warn = orWarn.bind(console);
      console.error = orErr.bind(console);
    },
    getLogCalls: () => callLog,
    getInfoCalls: () => callInfo,
    getErrCalls: () => callErr,
    getWarnCalls: () => callWarn,
  }
}

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
