const {expect} = require('chai')
const {buildExeRun} = require('../lib')

describe('kernel', () => {
  it('buildExeRun', async () => {
    // all negative
    {
      const cmd = `node -e "console.log('test'); process.exit(1)"`
      const cmds = [cmd, cmd, cmd]
      const reRunner = buildExeRun()
      const failedCmds = await reRunner(cmds)
      expect(failedCmds.length).to.eq(3)
    }
    // all positive
    {
      const cmd = `node -e "console.log('test')"`
      const cmds = [cmd, cmd, cmd]
      const reRunner = buildExeRun()
      const failedCmds = await reRunner(cmds)
      expect(failedCmds.length).to.eq(0)
    }
  })
})