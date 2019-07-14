const {spawn} = require('child_process')

const cmd = ['node', ['-e', "console.log(\'test\')"]]

const proc = spawn(...cmd)

proc.stdout.on('data', (data) => {
  console.log(data.toString('utf8'))
})