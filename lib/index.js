const path = require('path')
const fs = require('fs')
const {exec} = require('child_process')
const argv = require('minimist')(process.argv.slice(2))

let stdOutAnalize = (stack) => true
let maxSession = argv.sessionsCount || 5
let rerunCount = argv.count || 2
let configFilePath = argv.configPath || path.resolve(process.cwd(), './protractor.conf.js')
let grepKeyword = ''
let currentSessionCount = 0
let debug = false
let intervalPoll = 1000
let rerunCycleCB = async () => true
let specsDir = path.resolve(process.cwd(), './specs')
let longestTest = 450000

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
  (argv.log || debug) && console.log(cmd)
  const now = +Date.now();
  const proc = exec(cmd)
  let fullStack = ''
  const watcher = setInterval(() => {if(+Date.now() - now > longestTest) {clearInterval(watcher); proc.kill(); res(cmd)} }, 15000)

  proc.on('exit', () => {clearInterval(watcher)})
  proc.stdout.on('data', (data) => {(argv.log || debug) && console.log(data.toString('utf8')); fullStack += data.toString()})
  proc.stderr.on('data', (data) => console.log(data.toString('utf8')))
  proc.on('error', (e) => {console.error(e)})

  proc.on('close', (code) => {
    (argv.log || debug) && console.log(fullStack, code)
    if(code !== 0 && stdOutAnalize(fullStack)) {res(cmd)}
    else {if(code !== 0) {failedByAssert.push(cmd)}; res(null)}
  })
})


const getRunCommand = (file, conf = configFilePath) => {
  return `${path.resolve(process.cwd(), './node_modules/.bin/protractor')} ${conf} --specs ${file}`
}

async function exeRun(runArr, failArr = []) {
  runArr = runArr || walkSync(specsDir).map((file) => getRunCommand(file))

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
  buildExeRun: ({
    maxSessionCount = 5,
    specRerunCount = 2,
    stackAnalize = (stack) => true,
    everyCycleCallback = async () => true,
    grepWord = '',
    longestTestTime = 45000,
    debugProcess = false,
    pollTime = 1000}) => {

    debug = debugProcess
    longestTest = longestTestTime
    maxSession = maxSessionCount
    rerunCount = specRerunCount
    stdOutAnalize = stackAnalize
    grepKeyword = grepWord
    rerunCycleCB = everyCycleCallback
    intervalPoll = isNaN(Number(pollTime)) ? 1000 : Number(intervalPoll)
    return exeRun
  },
  getRunCommand,
  runPromise
}
