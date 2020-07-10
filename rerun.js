
const {getFilesList, buildExeRun} = require('./lib')

module.exports = {
  getReruner: function(optsObj) {
    return buildExeRun(optsObj)
  },
  getFilesList,
  getSpecFilesArr: getFilesList,
  getSpecCommands: function(pathToSpecDir, getRunCommandPattern) {
    return walkSync(pathToSpecDir).map(getRunCommandPattern)
  }
}