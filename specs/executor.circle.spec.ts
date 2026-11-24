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

  it('[p] circleExecutor shares cache from a producer to a consumer command', async () => {
    // producer publishes an entity on stdout, consumer requests it via --use-shared-cache.
    // `--` hands the flag to the eval script's argv (otherwise node itself would parse it).
    // the consumer JSON.parses the resolved --cache value to prove it is parseable inside the process.
    const producer = `node -e 'console.log("shared-cache: " + JSON.stringify(JSON.stringify({scope:"circle-scope",data:{n:7}})))'`;
    const consumer = `node -e 'const a = (process.argv.find(x => x.startsWith("--cache=")) || "").slice(8); const p = JSON.parse(a); console.log("PARSED:" + p["circle-scope"][0].n); process.exit(1)' -- --use-shared-cache={"circle-scope":1}`;

    let captured = '';
    await circleExecutor(
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

    // the child JSON.parsed the resolved --cache argument and read the entity back
    expect(captured).stringIncludesSubstring('PARSED:7');
    expect(captured).stringNotIncludesSubstring('--use-shared-cache');
  });

  it('[p] circleExecutor hands prefilled entities to consumers in order and stops when exhausted', async () => {
    // consumers request one entity each; the third finds the scope empty and gets no --cache arg
    const consumer = (tag: string) =>
      `node -e 'const a = (process.argv.find(x => x.startsWith("--cache=")) || "").slice(8); const p = a ? JSON.parse(a) : {}; console.log("${tag}:" + ((p["circle-prefill"] || [])[0] || {}).userId); process.exit(1)' -- --use-shared-cache={"circle-prefill":1}`;

    let captured = '';
    await circleExecutor(
      {
        maxThreads: 1,
        attemptsCount: 1,
        longestProcessTime: 20_000,
        pollTime: 10,
        sharedCache: { 'circle-prefill': [{ userId: 7 }, { userId: 8 }] },
        processResultAnalyzer: (_cmd: string, stackTrace: string) => {
          captured += stackTrace;
          return true;
        },
      },
      [consumer('FIRST'), consumer('SECOND'), consumer('THIRD')],
    );

    expect(captured).stringIncludesSubstring('FIRST:7');
    expect(captured).stringIncludesSubstring('SECOND:8');
    expect(captured).stringIncludesSubstring('THIRD:undefined');
    expect(captured).stringNotIncludesSubstring('--use-shared-cache');
  });

  it('[p] circleExecutor delivers prefilled entities via env var when sharedCacheVia is "env"', async () => {
    const consumer = `node -e 'const c = JSON.parse(process.env.PROCESS_RERUN_CACHE || "{}"); console.log("ENV:" + (c["circle-prefill-env"] || []).map(e => e.token).join(",")); process.exit(1)' --use-shared-cache={"circle-prefill-env":2}`;

    let captured = '';
    await circleExecutor(
      {
        maxThreads: 1,
        attemptsCount: 1,
        longestProcessTime: 20_000,
        pollTime: 10,
        sharedCacheVia: 'env',
        sharedCache: { 'circle-prefill-env': [{ token: 'a' }, { token: 'b' }] },
        processResultAnalyzer: (_cmd: string, stackTrace: string) => {
          captured += stackTrace;
          return true;
        },
      },
      [consumer],
    );

    expect(captured).stringIncludesSubstring('ENV:a,b');
  });

  it('[p] circleExecutor serves prefilled entities before ones published by a producer', async () => {
    const producer = `node -e 'console.log("shared-cache: " + JSON.stringify(JSON.stringify({scope:"circle-prefill-mix",data:"published"})))'`;
    const consumer = `node -e 'const a = (process.argv.find(x => x.startsWith("--cache=")) || "").slice(8); console.log("MIX:" + JSON.parse(a)["circle-prefill-mix"].join(",")); process.exit(1)' -- --use-shared-cache={"circle-prefill-mix":2}`;

    let captured = '';
    await circleExecutor(
      {
        maxThreads: 1,
        attemptsCount: 1,
        longestProcessTime: 20_000,
        pollTime: 10,
        sharedCache: { 'circle-prefill-mix': ['seeded'] },
        processResultAnalyzer: (_cmd: string, stackTrace: string) => {
          captured += stackTrace;
          return true;
        },
      },
      [producer, consumer],
    );

    expect(captured).stringIncludesSubstring('MIX:seeded,published');
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
