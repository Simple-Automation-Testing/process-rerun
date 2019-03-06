What is the problem ?
When some process failed we need tool for rerun that process controled times with some params.
In common cases we use protractor so next example for protractor

# From command line
```sh
./node_modules/.bin/process-rerun --protractor --configPath=./protractor.conf.js --specDir=./specs
```

# From js
```js
const { getReruner, getSpecFilesArr } = require('process-rerun')

/*
  @{pathToSpecDirectory} string // './specs'
  @{emptyArr} epmty arr // []
  @{skipFolders} if some folders should be excluded ['folderB','folderB']
  getSpecFilesArr(pathToSpecDirectory, emptyArr, skipFolders) params
*/
const specsArr = getSpecFilesArr('./specs')
// return all files in folder and subFolders
/*
[
  'specs/1.spec.ts',
  'specs/2.spec.ts',
  'specs/3.spec.ts',
  'specs/4.spec.ts',
  'specs/5.spec.ts',
  'specs/6.spec.ts',
  'specs/7.spec.ts',
  'specs/8.spec.ts',
  'specs/9.spec.ts'
]
*/
// now we need commands array
const formCommand = (filePath) => `./node_modules/.bin/protractor  ./protractor.conf.js  --specs ${filePath}`
const commandsArray = specsArr.map(filePath)
/*
[ './node_modules/.bin/protractor  ./protractor.conf.js  --specs specs/1.spec.ts',
  './node_modules/.bin/protractor  ./protractor.conf.js  --specs specs/2.spec.ts',
  './node_modules/.bin/protractor  ./protractor.conf.js  --specs specs/3.spec.ts',
  './node_modules/.bin/protractor  ./protractor.conf.js  --specs specs/4.spec.ts',
  './node_modules/.bin/protractor  ./protractor.conf.js  --specs specs/5.spec.ts',
  './node_modules/.bin/protractor  ./protractor.conf.js  --specs specs/6.spec.ts',
  './node_modules/.bin/protractor  ./protractor.conf.js  --specs specs/7.spec.ts',
  './node_modules/.bin/protractor  ./protractor.conf.js  --specs specs/8.spec.ts',
  './node_modules/.bin/protractor  ./protractor.conf.js  --specs specs/9.spec.ts' ]
*/

// now we need runner
/*
  getReruner(obj) params
  @{everyCycleCallback} function, will execute after full cycle done, before next cycle
  @{maxSessionCount} number, for example we have hub for 10 browsers, so maxSessionCount equal 10
  @{specRerunCount} number, hom many times will reruned failed processes
  @{stackAnalize} function, if stack trace includes some math this process will not go to rerun scope
*/
const cycleCB = () => console.log('Cycle done')
const stackAnalize = (stack) => !stack.includes('ASSERTION ERROR')

const runner = getReruner({
   everyCycleCallback: cycleCB,
   maxSessionCount: 1,
   specRerunCount: 3,
   stackAnalize: stackAnalize,
   debugProcess: processEnv.DEBUG_PROCESS
 })

getReruner().then((results) => console.log(results))
// return array with failed processes

```

Note about command re-format functions.

There are two command re-format functions, that you can pass to __getReruner__.
```js
const formCommanWithOption = (cmd) => {
  return {
    cmd: `${cmd} --someArgument=value --beforeRunFlag`,
    cmdExecutableCB: () => { /* make something specific after command has run */ }
  }
}

const reformatCommand = (cmd) => `${cmd} --someArgument=value --afterFirstRunFlag`

const runner = getReruner({
    formCommanWithOption,
    reformatCommand,
    /* other arguments */
 })
```
__formCommanWithOption__ - will help you to run your commands on some specific environment,
with some specific flags, etc. Also it allows you to execute some callback, after your command has run.

__reformatCommand__ - in another hand, allows you to add some specific options to command
after it failed during first execution
