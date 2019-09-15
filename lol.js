const Mocha = require('mocha'),
  fs = require('fs'),
  path = require('path');

const {getSpecFilesArr} = require('./rerun')

// Instantiate a Mocha instance.
var mocha = new Mocha();

const itSpecNameRegex = /(?<=it\(')(\d|\w|\s)+/ig



var testDir = path.relative(__dirname, './mocha_specs')

// Add each .js file to the mocha instance
getSpecFilesArr(testDir)


  .forEach(function(file) {

    const fileContent = fs.readFileSync(file, {encoding: 'utf8'})

    console.log(fileContent.match(itSpecNameRegex))

    // mocha.addFile(
    //   path.join(testDir, file)
    // );
  });




// // Run the tests.
// mocha.run(function(failures) {
//   process.exitCode = failures ? 1 : 0;  // exit with non-zero status if there were failures
// });