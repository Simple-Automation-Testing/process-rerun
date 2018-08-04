const {exec} = require('child_process')


const proc = exec('node ./con.js')

proc.on('close', (data) => console.log('CLOSE', data))
proc.on('exit', (data) => console.log('exit', data))