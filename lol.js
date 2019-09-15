const Mocha = require('mocha'),
  fs = require('fs'),
  path = require('path');

const {getSpecFilesArr} = require('./rerun')

// Instantiate a Mocha instance.
var mocha = new Mocha();

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


console.log(filesWithGrepOpts)



// // Run the tests.
// mocha.run(function(failures) {
//   process.exitCode = failures ? 1 : 0;  // exit with non-zero status if there were failures
// });