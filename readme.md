Rerun failed tests


default maxSessionCount is 5, for open 5 processes in parralel mode <br>
default specRerunCount is 3, failed tests will have 3 attempts <br>
default configPath is ./protractor.conf.js<br>
default specsDir is ./spec <br>
default debug is false <br>

Usage from command line
```sh
$ ./node_modules/.bin/protractor-rerun --sessionsCount 8 --count 3 --configPath ./path/to/your/protractor.conf.js --specsDir ./path/to/specDir --debug
```
Usage from package.json

```json
  "test:rerun": "protractor-rerun --sessionsCount 8 --count 3 --configPath ./path/to/your/protractor.conf.js --specsDir ./path/to/specDir --debug",
```

Usage from code
```js
const protractorRerun = require('protractor-rerun')

const formCommand = (browser, filePath) => {
  return `BROWSER=${browser} ./node_modules/.bin/protractor  ./protractor.conf.js  --specs ${filePath}`
}

protractorRerun.getSpecCommands(specsDirBaseDocuments, (file) => formCommand('chrome', file)),

const rerunner = protractorRerun.getReruner({
  everyCycleCallback: async () => true,
  stackAnalize: (stack) => !stack.includes('ASSERTION ERROR'),
  pollTime:1000,
  maxSessionCount: 12,
  specRerunCount: 3,
  grepWord: 'somegrep'
})

rerunner(protractorRerun.getSpecCommands('./specs', (file) => formCommand('chrome', file)))
```