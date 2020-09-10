# process-rerun

The purpose of this library is - build simple and flexible interface for parallel command execution with rerun (on fail) possibility

![npm downloads](https://img.shields.io/npm/dm/process-rerun.svg?style=flat-square)

[Documents](#documents)<br>
[Usage](#usage)<br>
[getFilesList](#getfileslist)<br>

## Documents

**buildRunner(buildOpts): returns rerunner: function(string[]): {retriable: string[]; notRetriable: string[]}**

arguments | description
--- | ---
**`buildOpts`** | Type: `object` <br> Options for executor
**`buildOpts.maxThreads`** | Type: `number`, <br> How many threads can be executed in same time <br> **Default threads count is 5**
**`buildOpts.attemptsCount`** | Type: `number`, <br> How many times can we try to execute command for success result **in next cycle will be executed only faild command, success commands will not be reexecuted** <br> **Default attempts count is 2**
**`buildOpts.pollTime`** | Type: `number`, <br> Period for recheck about free thread <br> **Default is 1 second**
**`buildOpts.successExitCode`** | Type: `number`, <br> Exit code what will be used for succes process check <br> **Default is 0**
**`buildOpts.logLevel`** | Type: `string`, one of 'ERROR', 'WARN', 'INFO', 'VERBOSE', <br> ERROR - only errors, WARN -  errors and warnings, INFO - errors, warnings and information, VERBOSE - full logging <br> **Default is 'ERROR'**
**`buildOpts.currentExecutionVariable`** | Type: `string`, will be execution variable with execution index for every cycle will be ++ <br>
**`buildOpts.everyCycleCallback`** | Type: `function`, <br> Optional. everyCycleCallback will be executed after cycle, before next execution cycle.<br> **Default is false**
**`buildOpts.processResultAnalyzer`** | Type: `function`, <br> Optional. processResultAnalyzer is a function where arguments are original command, execution stack trace and notRetriable array processResultAnalyzer should return a new command what will be executed in next cycle or **null** - if satisfactory result <br>
**`buildOpts.longestProcessTime`** | Type: `number`, <br> In case if command execution time is longer than longest Process Time - executor will kill it automatically and will try to execute this command again. <br> **Default time is 45 seconds**

## Usage

```js
const {buildRunner} = require('process-rerun');

async function execCommands() {
  const runner = buildRunner({
    maxThreads: 10,               // ten threads
    attemptsCount: 2,             // will try to pass all commands two times, one main and one times rerun
    longestProcessTime: 60 * 1000,// if command process execution time is longre than 1 minute will kill it and try to pass in next cycle
    pollTime: 1000,               // will check free thread every second
    everyCycleCallback: () => console.log('Cycle done'),
    processResultAnalyzer: (cmd, stackTrace, notRetriableArr) => {
      if (stackTrace.includes('Should be re executed')) {
        return cmd;
      }
      notRetriableArr.push(cmd)
    }, //true - command will be reexecuted
  });
  const result = await runner([
    `node -e 'console.log("Success first")'`,
    `node -e 'console.log("Success second")'`,
    `node -e 'console.log("Failed first"); process.exit(1)'`,
    `node -e 'console.log("Success third")'`,
    `node -e 'console.log("Failed second"); process.exit(1)'`,
  ])

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

## getfileslist

arguments | description
--- | ---
**`dir`** | Type: `string` , *required* <br> Directory what will be used as a root
**`fileList`** | Type: `Array<string>` ,  <br> This array will be used as a target for push new file
**`directoryToSkip`** | Type: `Array<string>|string|regex`, <br> Exlude some directory
**`ignoreSubDirs`** | Type: `boolean`, <br> In case of true - sub directories will be ignored

### usage exampele

```js
const {getFilesList} = require('process-rerun');

const readmePath = getFilesList(__dirname).find((filePath) => filePath.include('readme.md'));
```
