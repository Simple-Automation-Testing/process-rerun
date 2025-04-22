# process-rerun

The purpose of this library is - build simple and flexible interface for parallel command execution with rerun (on fail) possibility

![npm downloads](https://img.shields.io/npm/dm/process-rerun.svg?style=flat-square)

[Documents](#documents)<br> [Usage](#usage)<br> [Changelog](#changelog)

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
