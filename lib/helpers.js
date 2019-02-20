const fs = require('fs')
const path = require('path')
/**
  *  Current example for process-rerun with protractor framework
  *
  *
  * getRunCommand('./spec/test.file.spec.js', './protractor.conf.js')
  * @param {string} file path to spec file
  * @param {string} conf path to config file
  * @returns {string}
  */
const getRunCommand = (file, conf = path.resolve(process.cwd(), './protractor.conf.js')) => {
  return `${path.resolve(process.cwd(), './node_modules/.bin/protractor')} ${conf} --specs ${file}`
}

/**
  * @param {string} dir a path to the director what should be read
  * @param {array<string>} filelist option, empty array what will contains all files
  * @param {array<string>} directoryToSkip option, directories what should be exclude from files list
  * @returns {array<string>}
  */
const walkSync = function(dir, filelist = [], directoryToSkip = []) {
  const files = fs.readdirSync(dir)
  files.forEach(function(file) {
    const isDirr = fs.statSync(path.join(dir, file)).isDirectory()
    const shouldBeExcluded =
      (Array.isArray(directoryToSkip) && directoryToSkip.includes(file)) ||
      (typeof directoryToSkip === 'string' && file.includes(directoryToSkip)) ||
      (directoryToSkip instanceof RegExp && file.match(directoryToSkip))

    if(shouldBeExcluded) {return }

    if(isDirr) {
      filelist = walkSync(path.join(dir, file), filelist, directoryToSkip)
    } else {
      filelist.push(path.join(dir, file))
    }
  })
  return filelist
}

/**
  * @param {any} timeVal time for setInterval poller
  * @param {number} timeVal time for setInterval poller
  * @returns {number}
*/

const getPollTime = (timeVal) => {
  if(typeof timeVal !== 'number') {
    return isNaN(Number(timeVal)) ? 1000 : Number(timeVal)
  }
  return timeVal
}
/**
  * await sleep(5000)
  * @param {number} time
  */
const sleep = (time) => new Promise((res) => setTimeout(res, time))

module.exports = {
  getRunCommand,
  getPollTime,
  sleep,
  walkSync
}
