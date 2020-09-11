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
  };

  console.warn = function() {
    callWarn++;
  };

  console.error = function() {
    callErr++;
  };

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
  };
}

export {
  mockConsoleApi
};
