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
      expect(failedCmds.failedByAssert.length).to.eq(3)
    }
    // all positive
    {
      const cmd = `node -e "console.log('test')"`
      const cmds = [cmd, cmd, cmd]
      const reRunner = buildExeRun()
      const failedCmds = await reRunner(cmds)
      expect(failedCmds.failedByAssert.length).to.eq(0)
      expect(failedCmds.failedCommands.length).to.eq(0)
    }
  })
  it('buildExeRun currentExecutionVariable', async () => {
    // all negative
    {
      const cmd = `node -e "console.log('test'); process.exit(1)"`
      const cmds = [cmd]
      const reRunner = buildExeRun({currentExecutionVariable: 'CURRENT_EXECUTION_COUNT'})
      const failedCmds = await reRunner(cmds)
      expect(failedCmds.failedByAssert.length).to.eq(1)
      expect(failedCmds.failedCommands.every((failedCmd) => failedCmd.includes('CURRENT_EXECUTION_COUNT=0'))).to.eq(true)
    }
    // + stackAnalize
    {
      const cmd = `node -e "console.log('test'); process.exit(1)"`
      const stackAnalize = () => true
      const attemptsCount = 15
      const cmds = [cmd]
      const reRunner = buildExeRun({
        stackAnalize,
        attemptsCount,
        currentExecutionVariable: 'CURRENT_EXECUTION_COUNT'
      })
      const failedCmds = await reRunner(cmds)
      expect(failedCmds.failedCommands.length).to.eq(1)
      expect(failedCmds.failedCommands.every((failedCmd) => failedCmd.includes(`CURRENT_EXECUTION_COUNT=${attemptsCount - 1}`))).to.eq(true)
    }
  })
  it('formCommanWithOption', async () => {
    let holder = null
    const cmd = `node -e "console.log('test'); process.exit(1)"`
    const stackAnalize = () => true
    const attemptsCount = 2
    const formCommanWithOption = (cmd) => {
      return {
        cmd: `TEST_ENV=test ${cmd}`,
        cmdExecutableCB: () => holder = true
      }
    }
    const cmds = [cmd]
    const reRunner = buildExeRun({
      stackAnalize,
      formCommanWithOption,
      attemptsCount
    })
    const failedCmds = await reRunner(cmds)
    expect(failedCmds.failedByAssert).to.eql([])
    expect(failedCmds.failedCommands).to.eql([`${cmd}`])
    expect(holder).to.eq(true)
  })

  it('failedByAssert', async () => {
    {
      const cmd = `node -e "console.log('test'); process.exit(1)"`
      const cmds = [cmd, cmd, cmd]
      const reRunner = buildExeRun()
      const result = await reRunner(cmds)
      expect(result.failedByAssert.length).to.eq(3)
      expect(result.failedCommands.length).to.eq(0)
    }
    {
      const cmd = `node -e "console.log('test'); process.exit(0)"`
      const cmds = [cmd, cmd, cmd]
      const reRunner = buildExeRun()
      const result = await reRunner(cmds)
      expect(result.failedByAssert.length).to.eq(0)
      expect(result.failedCommands.length).to.eq(0)
    }
    {
      const cmd = `node -e "console.log('test'); process.exit(1)"`
      const cmdToRerrun = `node -e "console.log('should be rerruned'); process.exit(1)"`
      const cmds = [cmd, cmd, cmdToRerrun]
      const stackAnalize = (stack) => stack.includes('should be rerruned')
      const reRunner = buildExeRun({stackAnalize})
      const result = await reRunner(cmds)
      expect(result.failedByAssert.length).to.eq(2)
      expect(result.failedCommands.length).to.eq(1)
    }
  })
})