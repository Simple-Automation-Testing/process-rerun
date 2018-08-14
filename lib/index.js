const path = require('path')
const fs = require('fs')
const {exec} = require('child_process')

const failedByAssert = []

const walkSync = function(dir, filelist = []) {
  const files = fs.readdirSync(dir)
  files.forEach(function(file) {
    if(fs.statSync(path.join(dir, file)).isDirectory()) {
      filelist = walkSync(path.join(dir, file), filelist)
    }
    else {filelist.push(path.join(dir, file))}
  })
  return filelist
}

const sleep = (time) => new Promise((res) => setTimeout(res, time))


const runPromise = (cmd) => new Promise((res) => {
  const now = +Date.now(); const longestTest = 450000
  const proc = exec(cmd)
  let fullStack = ''
  const watcher = setInterval(() => {if(+Date.now() - now > longestTest) {clearInterval(watcher); proc.kill(); res(cmd)} }, 15000)

  proc.on('exit', () => {clearInterval(watcher)})
  proc.stdout.on('data', (data) => {fullStack += data.toString()})
  proc.on('error', (e) => {console.error(e)})

  proc.on('close', (code) => {
    if(code !== 0 && stdOutAnalize(fullStack)) {res(cmd)}
    else {if(code !== 0) {failedByAssert.push(cmd)}; res(null)}
  })
})


const getRunCommand = (file) => `${path.resolve(process.cwd(), './node_modules/.bin/protractor')} ${configFilePath} --specs ${file}`

async function exeRun(runArr, failArr = []) {
  runArr = runArr || walkSync(specsDir).map(getRunCommand)

  runArr = runArr.filter(function(cmd) {return cmd.includes(grepKeyword)})

  const failedTests = await new Array(rerunCount).join('_').split('_').reduce((resolver) => {
    return resolver.then(resolvedArr => performRun(resolvedArr, []).then(failedArr => failedArr))
  }, Promise.resolve(runArr))

  async function runCommandsArr(runnCommandsArr, failedArr) {
    if(maxSession > currentSessionCount && runnCommandsArr.length) {
      currentSessionCount += 1
      const result = await runPromise(runnCommandsArr.splice(0, 1)[0]).catch(console.error)
      if(result) {failedArr.push(result)}
      currentSessionCount -= 1
    }
  }

  async function performRun(runSuits, failedRun) {
    const asserter = setInterval(() => runCommandsArr(runSuits, failedRun), intervalPoll)

    do {
      if(runSuits.length) {await runCommandsArr(runSuits, failedRun)}
      if(currentSessionCount) {await sleep(2500)}
    } while(runSuits.length || currentSessionCount)

    await rerunCycleCB()
    clearInterval(asserter)
    return failedRun
  }

  console.log(failedTests.length, 'Failed test count')
  return [...failedTests, ...failedByAssert]
}

module.exports = {
  walkSync,
  sleep,
  exeRun,
  getRunCommand,
  runPromise
}