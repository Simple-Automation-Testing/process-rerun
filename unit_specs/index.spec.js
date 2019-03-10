const {expect} = require('chai')
const {buildExeRun} = require('../lib')

describe('kernel', () => {
  it('buildExeRun basic execution', async () => {
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
  it('buildExeRun currentExecutionVariable', async () => {
    // all negative
    {
      const cmd = `node -e "console.log('test'); process.exit(1)"`
      const cmds = [cmd]
      const reRunner = buildExeRun({currentExecutionVariable: 'CURRENT_EXECUTION_COUNT'})
      const failedCmds = await reRunner(cmds)
      expect(failedCmds.length).to.eq(1)
      expect(failedCmds.every((failedCmd) => failedCmd.includes('CURRENT_EXECUTION_COUNT=0'))).to.eq(true)
    }
    // + stackAnalize
    {
      const cmd = `node -e "console.log('test'); process.exit(1)"`
      const stackAnalize = () => true
      const specRerunCount = 15
      const cmds = [cmd]
      const reRunner = buildExeRun({
        stackAnalize,
        specRerunCount,
        currentExecutionVariable: 'CURRENT_EXECUTION_COUNT'
      })
      const failedCmds = await reRunner(cmds)
      expect(failedCmds.length).to.eq(1)
      expect(failedCmds.every((failedCmd) => failedCmd.includes(`CURRENT_EXECUTION_COUNT=${specRerunCount - 1}`))).to.eq(true)
    }
  })
})