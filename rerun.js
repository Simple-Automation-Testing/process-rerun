const path = require('path')
const fs = require('fs')
const {exec} = require('child_process')
const {walkSync, exeRun, runPromise, sleep, getRunCommand} = require('./lib')
const argv = require('minimist')(process.argv.slice(2));


let stdOutAnalize = (stack) => true
let maxSession = argv.sessionsCount || 5
let rerunCount = argv.count || 2
let configFilePath = argv.configPath || path.resolve(process.cwd(), './protractor.conf.js')
let grepKeyword = ''
let currentSessionCount = 0
let intervalPoll = 1000
let rerunCycleCB = async () => true
let specsDir = path.resolve(process.cwd(), './specs')

module.exports = {
  getReruner: function({
    maxSessionCount = 5,
    specRerunCount = 2,
    stackAnalize = (stack) => true,
    everyCycleCallback = async () => true,
    grepWord = '',
    pollTime = 1000}) {

    maxSession = maxSessionCount
    rerunCount = specRerunCount
    stdOutAnalize = stackAnalize
    grepKeyword = grepWord
    rerunCycleCB = everyCycleCallback
    intervalPoll = isNaN(Number(pollTime)) ? 1000 : Number(intervalPoll)
    return exeRun
  },

  getSpecCommands: function(pathToSpecDir, getRunCommandPattern) {
    return walkSync(pathToSpecDir).map(getRunCommandPattern)
  }
}
