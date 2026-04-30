import { expect } from 'assertior';
import { circleExecutor } from '../lib/executor.circle';

const processResultAnalyzer = (cmd: string) => cmd;

describe('executor circle', () => {
  it('[p] circleExecutor longestProcessTime kill procs', async () => {
    const commands = [`node -e 'setTimeout(() => console.log("Success first"), 5000)'`];
    const result = await circleExecutor(
      {
        maxThreads: 4,
        attemptsCount: 1,
        longestProcessTime: 1000,
        pollTime: 10,
      },
      commands,
    );
    expect(result.notRetriable).toDeepEqual([]);
    expect(result.retriable).toDeepEqual(commands);
  });

  it('[p] circleExecutor longestProcessTime ', async () => {
    const commands = [`node -e 'setTimeout(() => console.log("Success first"), 5000)'`];
    const result = await circleExecutor(
      {
        maxThreads: 4,
        attemptsCount: 1,
        longestProcessTime: 10_000,
        pollTime: 10,
      },
      commands,
    );
    expect(result.notRetriable).toDeepEqual([]);
    expect(result.retriable).toDeepEqual([]);
    expect(result.retriable).toNotDeepEqual(commands);
    expect(result.retriable.length).toEqual(0);
  });

  it('[p] circleExecutor longestProcessTime  kill processResultAnalyzer return null notRetriable auto push', async () => {
    const commands = [
      `node -e 'setTimeout(() => console.log("Success first"), 5000)'`,
      `node -e 'setTimeout(() => console.log("Success second"), 5000)'`,
    ];
    const result = await circleExecutor(
      {
        maxThreads: 4,
        attemptsCount: 1,
        longestProcessTime: 10,
        processResultAnalyzer: () => null,
        pollTime: 10,
      },
      commands,
    );
    expect(result.notRetriable).toDeepEqual(commands);
    expect(result.retriable).toDeepEqual([]);
    expect(result.retriable).toNotDeepEqual(commands);
    expect(result.retriable.length).toEqual(0);
  });

  it('[p] circleExecutor longestProcessTime  kill processResultAnalyzer return cmd notRetriable auto push', async () => {
    const commands = [`node -e 'setTimeout(() => console.log("Success first"), 5000)'`];
    const result = await circleExecutor(
      {
        maxThreads: 4,
        attemptsCount: 1,
        longestProcessTime: 10,
        processResultAnalyzer: (cmd: string) => cmd,
        pollTime: 10,
      },
      commands,
    );
    expect(result.notRetriable).toDeepEqual([]);
    expect(result.retriable).toDeepEqual(commands);
  });

  it('[p] circleExecutor processResultAnalyzer arguments', async () => {
    const commands = [
      `node -e 'setTimeout(() => {console.log("Success first"); throw new Error("This is test error")}, 1000)'`,
    ];
    let cmdTest: string | null = null;
    let stackTraceTest: string | null = null;
    let notRetriableTest: string[] | null = null;
    const processResultAnalyzer = (cmd: string, stackTrace: string, notRetriable: string[]) => {
      cmdTest = cmd;
      stackTraceTest = stackTrace;
      notRetriableTest = [...notRetriable];
      return cmd;
    };
    const result = await circleExecutor(
      {
        maxThreads: 4,
        attemptsCount: 1,
        longestProcessTime: 10 * 1000,
        processResultAnalyzer,
        pollTime: 10,
      },
      commands,
    );
    expect(result.notRetriable).toDeepEqual([]);
    expect(result.retriable).toDeepEqual(commands);
    expect(cmdTest).toEqual(commands[0]);
    expect(notRetriableTest).toDeepEqual(result.notRetriable);
    expect(stackTraceTest).stringIncludesSubstring('This is test error');
  });

  it('[p] circleExecutor successExitCode', async () => {
    const commands = [`node -e 'setTimeout(() => {console.log("Success first"); process.exit(100)}, 1000)'`];

    const result = await circleExecutor(
      {
        maxThreads: 4,
        attemptsCount: 1,
        longestProcessTime: 10 * 1000,
        processResultAnalyzer,
        successExitCode: 100,
        pollTime: 10,
      },
      commands,
    );
    expect(result.notRetriable).toDeepEqual([]);
    expect(result.retriable).toDeepEqual([]);
  });
});
