# process-rerun

The purpose of this library is - build simple and flexible interface for parallel command execution with rerun (on fail) possibility

![npm downloads](https://img.shields.io/npm/dm/process-rerun.svg?style=flat-square)

[Documents](#documents)<br> [Usage](#usage)<br> [Sharing data between processes](#sharing-data-between-processes-shared-cache)<br> [Changelog](#changelog)

## Documents

**buildRunner(buildOpts): returns rerunner: function(string[]): {retriable: string[]; notRetriable: string[]}**

| arguments | description |
| --- | --- |
| **`buildOpts`** | Type: `object` <br> Options for executor |
| **`buildOpts.maxThreads`** | **Optional** Type: `number`, <br> How many threads can be executed in same time <br> **Default threads count is 5** |
| **`buildOpts.intime`** | **Optional** Type: `boolean`, <br> if intime is true intime execution approach will be enabled<br> **Default is false** |
| **`buildOpts.shuffle`** | **Optional** Type: `boolean`, <br> Shuffle commands during execution <br> **Default threads count is 5** |
| **`buildOpts.attemptsCount`** | **Optional** Type: `number`, <br> How many times can we try to execute command for success result **in next cycle will be executed only faild command, success commands will not be reexecuted** <br> **Default attempts count is 2** |
| **`buildOpts.pollTime`** | **Optional** Type: `number`, <br> Period for recheck about free thread <br> **Default is 1 second** |
| **`buildOpts.successExitCode`** | **Optional** Type: `number`, <br> Exit code what will be used for succes process check <br> **Default is 0** |
| **`buildOpts.logLevel`** | Type: `string`, one of 'ERROR', 'WARN', 'INFO', 'VERBOSE', 'MUTE' <br> ERROR - only errors, WARN - errors and warnings, INFO - errors, warnings and information, VERBOSE - full logging, MUTE - mute execution output <br> **Default is 'ERROR'** |
| **`buildOpts.currentExecutionVariable`** | **Optional** Type: `string`, will be execution variable with execution index for every cycle will be ++<br> |
| **`buildOpts.everyCycleCallback`** | **Optional** Type: `function`, <br> Optional. everyCycleCallback will be executed after cycle, before next execution cycle.<br> **Default is false** |
| **`buildOpts.processResultAnalyzer`** | **Optional** Type: `function`, <br> Optional. processResultAnalyzer is a function where arguments are original command, execution stack trace and notRetriable array processResultAnalyzer should return a new command what will be executed in next cycle or **boolean** - if satisfactory result <br> |
| **`buildOpts.longestProcessTime`** | **Optional** Type: `number`, <br> In case if command execution time is longer than longest Process Time - executor will kill it automatically and will try to execute this command again. <br> **Default time is 45 seconds** |

## Usage

```js
const { buildRunner } = require('process-rerun');

async function execCommands() {
  const runner = buildRunner({
    maxThreads: 10, // ten threads
    attemptsCount: 2, // will try to pass all commands two times, one main and one times rerun
    longestProcessTime: 60 * 1000, // if command process execution time is longre than 1 minute will kill it and try to pass in next cycle
    pollTime: 1000, // will check free thread every second
    everyCycleCallback: () => console.log('Cycle done'),
    processResultAnalyzer: (cmd, stackTrace, notRetriableArr) => {
      if (stackTrace.includes('Should be re executed')) {
        return cmd;
      }
      notRetriableArr.push(cmd);
    }, //true - command will be reexecuted
  });
  const result = await runner([
    `node -e 'console.log("Success first")'`,
    `node -e 'console.log("Success second")'`,
    `node -e 'console.log("Failed first"); process.exit(1)'`,
    `node -e 'console.log("Success third")'`,
    `node -e 'console.log("Failed second"); process.exit(1)'`,
  ]);

  console.log(result);
  /*
  {
    retriable: [
      `node -e 'console.log("Failed first"); process.exit(1)' --opt1=opt1value --opt1=opt1value`,
      `node -e 'console.log("Failed second"); process.exit(1)' --opt1=opt1value --opt1=opt1value`
    ],
    notRetriable: []
  }
  */
}
```

## Sharing data between processes (shared cache)

Because every command runs as an isolated child process, they cannot talk to each
other directly. `process-rerun` provides a lightweight, one-way channel that lets a
command **publish** data and a later command **consume** it. The runner keeps an
in-memory, per-run store (the *shared cache*) that sits between processes: producers
write to it through their stdout, consumers read from it through a command-line argument.

The whole exchange happens over plain text, so it works with any language or binary you
execute — a producer only has to print one line, a consumer only has to read one argument.

### Producing data — publish an entity from stdout

To put something into the shared cache, a process prints a single line in this exact shape:

```
shared-cache: "<json string>"
```

The value between the double quotes is a **JSON string** (its inner quotes escaped) that
decodes to an object with exactly two keys:

| key | type | description |
| --- | --- | --- |
| **`scope`** | `string` | The bucket the entity belongs to. Consumers request entities by this name. |
| **`data`** | `any` | The payload to share — any JSON-serializable value. |

For example, a Node process publishing an auth token under the `auth` scope:

```js
// producer.js
const entity = { scope: 'auth', data: { token: 'abc123', userId: 7 } };

// JSON.stringify twice: once for the payload, once to wrap it as a quoted json string
console.log('shared-cache: ' + JSON.stringify(JSON.stringify(entity)));
// stdout -> shared-cache: "{\"scope\":\"auth\",\"data\":{\"token\":\"abc123\",\"userId\":7}}"
```

A process may print **as many `shared-cache:` lines as it wants** — the runner scans the
full stdout, parses every one in the order they were printed, and **appends** each `data`
to the list kept for its `scope`. Publishing several entities under the same scope (from a
single process printing multiple lines, or across many processes) accumulates them:

```
cache = {
  auth: [ { token: 'abc123', userId: 7 }, { token: 'def456', userId: 8 } ]
}
```

### Consuming data — request entities via `--use-shared-cache`

A later command asks for entities by adding a `--use-shared-cache` argument whose value is
a JSON object of `{ "<scope>": <amount> }`, where `amount` is **how many entities to take**
from that scope:

```
my-runner --use-shared-cache={"auth":1}
```

Right before the command is executed, the runner:

1. Reads the request and **removes (consumes)** up to `amount` entities from each named
   scope — taken entities are no longer available to other commands.
2. If anything was gathered, it **rewrites** the argument into a `--cache` argument that
   carries the actual entities, grouped by scope:

   ```
   my-runner --use-shared-cache={"auth":1}
   # becomes
   my-runner --cache='{"auth":[{"token":"abc123","userId":7}]}'
   ```

3. If nothing could be gathered (empty or unknown scope), the `--use-shared-cache`
   argument is **stripped** so the child never sees it.

The child process reads its entities from the resolved `--cache` argument and parses it:

```js
// consumer.js
const raw = (process.argv.find(arg => arg.startsWith('--cache=')) || '').slice('--cache='.length);
const cache = raw ? JSON.parse(raw) : {};

const [token] = cache.auth || [];
console.log('using token', token); // -> using token { token: 'abc123', userId: 7 }
```

The value is shell-escaped before delivery, so the JSON stays intact and `JSON.parse`-able
inside the child even when the data contains characters such as single quotes.

### End-to-end example

```js
const { buildRunner } = require('process-rerun');

const runner = buildRunner({ maxThreads: 1 }); // single thread => the producer runs first

runner([
  // producer: publishes an entity into the "auth" scope
  `node -e 'console.log("shared-cache: " + JSON.stringify(JSON.stringify({scope:"auth",data:{token:"abc123"}})))'`,

  // consumer: requests one "auth" entity; receives it via a resolved --cache argument
  `node -e 'const c = JSON.parse((process.argv.find(a => a.startsWith("--cache=")) || "").slice(8) || "{}"); console.log("got", c.auth)' -- --use-shared-cache={"auth":1}`,
]);
```

### Notes and guarantees

- **Ordering is your responsibility.** A consumer only sees what has already been published
  by the time it starts. Make sure producers run before consumers — for example with
  `maxThreads: 1`, or by scheduling producer and consumer commands in separate runs/cycles.
- **Consumption is destructive.** Each requested entity is taken out of the cache. If a
  command retries after consuming, the entities are already gone; the retry re-reads the
  cache as it stands at that moment.
- **The cache lives for the process that runs the executor** and is kept per execution mode
  (intime / circle). It is in-memory only — nothing is persisted between separate runs.
- **Shell-specific quoting.** The resolved `--cache` value is escaped for POSIX shells.

## intime approach vs circle approach

### circle approach

five processes execution, two execution attempts, five parallel execution <br>

| first execution attempt (three failed) | second execution attempt (one failed) | third execution attempt (o failed) |
| --- | --- | --- |
| 1 p1 --------------------------> success | p2 ---> success | p4 -----------> success |
| 2 p2 ---> fail | p4 -----------> fail |
| 3 p3 -------> fail | p3 -------> success |
| 4 p4 -----------> fail |  |
| 5 p5 -----> success |  |

Full execution time: <br> p1 (first attempt) --------------------------> + p4 (second attempt) -----------> + (third attempt) p4 ----------->

### intime approach (with same fail scheme)

every process has attemp count timer

f - fail <br> s - success <br> 1 p1 -------------------------->s <br> 2 p2 --->f--->s <br> 3 p3 ------->f------->s <br> 4 p4 ----------->f <br> 5 p5 ----->s(p4)----------->f----------->s <br>

Full execution time: <br>

5 p5 ----->s(p4)----------->f----------->s

Failed process will check that free parallel exists and start execution when free parallel will be found.

## Changelog

[Version 0.1.11](/docs/verion0.1.11.md)
