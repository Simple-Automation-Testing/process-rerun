
const {walkSync, buildExeRun} = require('./lib')

module.exports = {
  getReruner: function(optsObj) {
    return buildExeRun(optsObj)
  },
  getSpecCommands: function(pathToSpecDir, getRunCommandPattern) {
    return walkSync(pathToSpecDir).map(getRunCommandPattern)
  }
}
