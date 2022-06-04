import { expect } from 'assertior';
import { getReruner } from '../lib';

describe('index ', () => {
  it('[p] longestProcessTime kill procs', async function () {
    const commands = [`node -e 'setTimeout(() => console.log("Success first"), 5000)'`];
    const runner = getReruner({
      maxThreads: 4,
      attemptsCount: 1,
      longestProcessTime: 1000,
      pollTime: 10,
      logLevel: 'MUTE',
    });
    const result = await runner(commands);
    expect(result.notRetriable).toDeepEqual([]);
    expect(result.retriable).toDeepEqual(commands);
  });

  it('[p] longestProcessTime ', async function () {
    const commands = [`node -e 'setTimeout(() => console.log("Success first"), 5000)'`];
    const runner = getReruner({
      maxThreads: 4,
      attemptsCount: 1,
      longestProcessTime: 10_000,
      pollTime: 10,
      logLevel: 'MUTE',
    });
    const result = await runner(commands);
    expect(result.notRetriable).toDeepEqual([]);
    expect(result.retriable).toDeepEqual([]);
    expect(result.retriable).toNotDeepEqual(commands);
    expect(result.retriable.length).toEqual(0);
  });

  it('[p] longestProcessTime  kill processResultAnalyzer return null notRetriable auto push', async function () {
    const commands = [
      `node -e 'setTimeout(() => console.log("Success first"), 5000)'`,
      `node -e 'setTimeout(() => console.log("Success second"), 5000)'`,
    ];
    const runner = getReruner({
      maxThreads: 4,
      attemptsCount: 1,
      longestProcessTime: 10,
      processResultAnalyzer: () => null,
      pollTime: 10,
      logLevel: 'MUTE',
    });
    const result = await runner(commands);
    expect(result.notRetriable).toDeepEqual(commands);
    expect(result.retriable).toDeepEqual([]);
    expect(result.retriable).toNotDeepEqual(commands);
    expect(result.retriable.length).toEqual(0);
  });

  it('[p] longestProcessTime  kill processResultAnalyzer return cmd notRetriable auto push', async function () {
    const commands = [`node -e 'setTimeout(() => console.log("Success first"), 5000)'`];
    const runner = getReruner({
      maxThreads: 4,
      attemptsCount: 1,
      longestProcessTime: 10,
      processResultAnalyzer: cmd => cmd,
      pollTime: 10,
      logLevel: 'MUTE',
    });
    const result = await runner(commands);
    expect(result.notRetriable).toDeepEqual([]);
    expect(result.retriable).toDeepEqual(commands);
  });

  it('[p] processResultAnalyzer arguments', async function () {
    const commands = [
      `node -e 'setTimeout(() => {console.log("Success first"); throw new Error("This is test error")}, 1000)'`,
    ];
    let cmdTest = null;
    let stackTraceTest = null;
    let notRetriableTest = null;
    const processResultAnalyzer = (cmd, stackTrace, notRetriable) => {
      cmdTest = cmd;
      stackTraceTest = stackTrace;
      notRetriableTest = [...notRetriable];
      return cmd;
    };
    const runner = getReruner({
      maxThreads: 4,
      attemptsCount: 1,
      longestProcessTime: 10 * 1000,
      processResultAnalyzer,
      pollTime: 10,
      logLevel: 'MUTE',
    });
    const result = await runner(commands);
    expect(result.notRetriable).toDeepEqual([]);
    expect(result.retriable).toDeepEqual(commands);
    expect(cmdTest).toEqual(commands[0]);
    expect(notRetriableTest).toDeepEqual(result.notRetriable);
    expect(stackTraceTest).stringIncludesSubstring('This is test error');
  });

  it('[p] successExitCode', async function () {
    const commands = [`node -e 'setTimeout(() => {console.log("Success first"); process.exit(100)}, 1000)'`];
    const processResultAnalyzer = cmd => cmd;
    const runner = getReruner({
      maxThreads: 4,
      attemptsCount: 1,
      longestProcessTime: 10 * 1000,
      processResultAnalyzer,
      successExitCode: 100,
      pollTime: 10,
      logLevel: 'MUTE',
    });
    const result = await runner(commands);
    expect(result.notRetriable).toDeepEqual([]);
    expect(result.retriable).toDeepEqual([]);
  });
});
