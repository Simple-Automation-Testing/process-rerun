// temp base modules
const Mocha = require('mocha')
const fs = require('fs')
const path = require('path')
const {getSpecFilesArr} = require('./rerun')
// temp base modules


// temp hardcoded values
const everyCycleCallback = null
const intervalPoll = 500
const debugProcess = false
const maxSessionCount = 5
const executionTimesCount = 3
// temp hardcoded values


let currentSessionCount = 0





const itSpecNameRegex = /(?<=it\(')(\d|\w|\s)+/ig


const filesWithGrepOpts = []


var testDir = path.relative(__dirname, './mocha_specs')

// Add each .js file to the mocha instance
getSpecFilesArr(testDir).forEach(function(file) {

  const fileContent = fs.readFileSync(file, {encoding: 'utf8'})

  const stepGreps = fileContent.match(itSpecNameRegex)

  stepGreps.forEach(function(grepItem) {
    filesWithGrepOpts.push({file, grepItem})
  })

  // mocha.addFile(
  //   path.join(testDir, file)
  // );
});


async function executeCommandAsync(cmd, runIndex) {

  // console.log(cmd)
  if(!cmd) return

  return new Promise(function(resolve) {
    const mocha = new Mocha()
    console.log(cmd.file)
    mocha.addFile(cmd.file)
    mocha.grep(cmd.grepItem)
    console.log(cmd)

    mocha.run(function(failures) {
      console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! 11111')
      if(cmd.file === 'mocha_specs/2.spec.js', cmd.grepItem === 'it 2 second describe ') {
        console.log('should fail', '!!!!!!!!!!!!!!!!!!!!!', failures)
        process.exit(0)
      }
      console.log('FAILERS', failures)
      resolve(true)
    })

  })
}


const item = {
  file: 'mocha_specs/2.spec.js',
  grepItem: 'it 2 second describe '
}







executeCommandAsync(item)




// runCommandsArray(filesWithGrepOpts, [], 0).then(console.log)






async function runCommand(commands, failedCommands, runIndex) {
  if(maxSessionCount > currentSessionCount && commands.length) {
    currentSessionCount += 1
    const result = await executeCommandAsync(commands.splice(0, 1)[0], runIndex).catch(console.error)
    if(result) {
      failedCommands.push(result)
    }
    currentSessionCount -= 1
  }
}




async function runCommandsArray(commands, failedCommands, executionCount) {

  const asserter = setInterval(() => runCommand(commands, failedCommands, executionCount), intervalPoll);

  do {
    if(commands.length) {await runCommand(commands, failedCommands, executionCount)}
    if(currentSessionCount) {await sleep(2000)}
  } while(commands.length || currentSessionCount)

  if(everyCycleCallback && typeof everyCycleCallback === 'function') {
    try {
      await everyCycleCallback()
    } catch(e) {
      console.log(e)
    }
  }

  clearInterval(asserter)
  return failedCommands
}



/*
const executionTimes = new Array(executionTimesCount).fill('noop')
  .reduce((resolver,  current, index) => {

    if(debugProcess) {
      console.info('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>')
      console.info(`Execution number: ${index}`)
      console.info('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>')
    }

    return resolver.then((resolvedCommandsArray) => {
      if(debugProcess) {
        console.info('=========================================================================')
        console.info(`Processes count: ${resolvedCommandsArray.length}`)
        console.info('=========================================================================')
      }
      return runCommandsArray(resolvedCommandsArray, [], index)

        .then((failedCommandsArray) => {
          return failedCommandsArray
        })
    })
  }, Promise.resolve(filesWithGrepOpts))

*/

// // Run the tests.
// mocha.run(function(failures) {
//   process.exitCode = failures ? 1 : 0;  // exit with non-zero status if there were failures
// });