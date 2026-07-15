import { expect } from 'assertior';
import { intimeExecutor } from '../lib/executor.intime';

const processResultAnalyzer = (cmd: string) => cmd;

describe('', () => {
  it('[p] intimeExecutor longestProcessTime kill procs', async () => {
    const commands = [`node -e 'setTimeout(() => console.log("Success first"), 5000)'`];
    const result = await intimeExecutor(
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

  it('[p] intimeExecutor longestProcessTime ', async () => {
    const commands = [`node -e 'setTimeout(() => console.log("Success first"), 5000)'`];
    const result = await intimeExecutor(
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

  it('[p] intimeExecutor longestProcessTime  kill processResultAnalyzer return null notRetriable auto push', async () => {
    const commands = [
      `node -e 'setTimeout(() => console.log("Success first"), 5000)'`,
      `node -e 'setTimeout(() => console.log("Success second"), 5000)'`,
    ];
    const result = await intimeExecutor(
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

  it('[p] intimeExecutor longestProcessTime  kill processResultAnalyzer return cmd notRetriable auto push', async () => {
    const commands = [`node -e 'setTimeout(() => console.log("Success first"), 5000)'`];
    const result = await intimeExecutor(
      {
        maxThreads: 4,
        attemptsCount: 1,
        longestProcessTime: 10,
        processResultAnalyzer: cmd => cmd,
        pollTime: 10,
      },
      commands,
    );
    expect(result.notRetriable).toDeepEqual([]);
    expect(result.retriable).toDeepEqual(commands);
  });

  it('[p] intimeExecutor processResultAnalyzer arguments', async () => {
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
    const result = await intimeExecutor(
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

  it('[p] intimeExecutor shares cache from a producer to a consumer command', async () => {
    // producer publishes an entity on stdout, consumer requests it via --use-shared-cache.
    // `--` hands the flag to the eval script's argv (otherwise node itself would parse it).
    // the entity data contains a single quote (q = String.fromCharCode(39)) to prove the
    // resolved --cache value survives the shell and is JSON.parse-able inside the child.
    const producer = `node -e 'const q = String.fromCharCode(39); console.log("shared-cache: " + JSON.stringify(JSON.stringify({scope:"intime-scope",data:{name:"O"+q+"Brien"}})))'`;
    const consumer = `node -e 'const a = (process.argv.find(x => x.startsWith("--cache=")) || "").slice(8); const p = JSON.parse(a); console.log("PARSED:" + p["intime-scope"][0].name); process.exit(1)' -- --use-shared-cache={"intime-scope":1}`;

    let captured = '';
    await intimeExecutor(
      {
        // single thread + producer first guarantees the cache is populated before the consumer runs
        maxThreads: 1,
        attemptsCount: 1,
        longestProcessTime: 20_000,
        pollTime: 10,
        processResultAnalyzer: (_cmd: string, stackTrace: string) => {
          captured += stackTrace;
          return true;
        },
      },
      [producer, consumer],
    );

    // the child JSON.parsed the resolved --cache argument and read the entity back intact
    expect(captured).stringIncludesSubstring("PARSED:O'Brien");
    // the request placeholder never leaked to the child
    expect(captured).stringNotIncludesSubstring('--use-shared-cache');
  });

  it('[p] intimeExecutor collects several shared-cache lines from one process', async () => {
    // a single producer publishes three entities into the same scope on separate lines
    const producer = `node -e 'for (const n of [1,2,3]) console.log("shared-cache: " + JSON.stringify(JSON.stringify({scope:"multi",data:{n}})))'`;
    // consumer asks for two of them and prints how many it received
    const consumer = `node -e 'const c = JSON.parse((process.argv.find(a => a.startsWith("--cache=")) || "").slice(8) || "{}"); console.log("COUNT:" + (c.multi || []).length + " NS:" + (c.multi || []).map(e => e.n).join(",")); process.exit(1)' -- --use-shared-cache={"multi":2}`;

    let captured = '';
    await intimeExecutor(
      {
        maxThreads: 1,
        attemptsCount: 1,
        longestProcessTime: 20_000,
        pollTime: 10,
        processResultAnalyzer: (_cmd: string, stackTrace: string) => {
          captured += stackTrace;
          return true;
        },
      },
      [producer, consumer],
    );

    // all three lines were captured; the consumer took the first two in printed order
    expect(captured).stringIncludesSubstring('COUNT:2 NS:1,2');
  });

  it('[p] intimeExecutor strips --use-shared-cache when nothing is cached', async () => {
    const consumer = `node -e 'const a = process.argv.find(x => x.startsWith("--cache=")); console.log("RECEIVED:" + (a || "NONE")); process.exit(1)' -- --use-shared-cache={"empty-scope":1}`;

    let captured = '';
    await intimeExecutor(
      {
        maxThreads: 1,
        attemptsCount: 1,
        longestProcessTime: 20_000,
        pollTime: 10,
        processResultAnalyzer: (_cmd: string, stackTrace: string) => {
          captured += stackTrace;
          return true;
        },
      },
      [consumer],
    );

    // with nothing cached the flag is stripped, so the child receives no --cache argument
    expect(captured).stringIncludesSubstring('RECEIVED:NONE');
    expect(captured).stringNotIncludesSubstring('--use-shared-cache');
    expect(captured).stringNotIncludesSubstring('--cache=');
  });

  it('[p] intimeExecutor successExitCode', async () => {
    const commands = [`node -e 'setTimeout(() => {console.log("Success first"); process.exit(100)}, 1000)'`];

    const result = await intimeExecutor(
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
