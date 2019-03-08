const {expect} = require('chai')

const {buildCommandExecutor} = require('../lib/commandExecutorBuilder')

describe('buildCommandExecutor', () => {

  it('addSpecificOptionsBeforeRun', async () => {
    const failedByAssert = []
    let holder = null

    const addSpecificOptionsBeforeRun = (cmd) => {
      const reformatedCmd = `${cmd} && echo "FOO"`
      holder = {cmd: reformatedCmd}
      const cmdExecutableCB = () => {holder.exec = true}

      return {cmd, cmdExecutableCB}
    }

    const executeCommandAsync = buildCommandExecutor(failedByAssert, {addSpecificOptionsBeforeRun})
    await executeCommandAsync('node -e "console.log(\'test\')"')
    expect(holder.cmd).to.eq('node -e "console.log(\'test\')" && echo "FOO"')
    expect(holder.exec).to.eq(true)
  })

  it('addCommandOptionsAfterRun', async () => {
    const failedByAssert = []
    let holder = null

    const cmd = `node -e "console.log('test'); process.exit(1)"`

    const addCommandOptionsAfterRun = (cmd, stack) => {
      holder = {}
      holder.cmd = cmd
      holder.stack = stack
    }
    const executeCommandAsync = buildCommandExecutor(failedByAssert, {addCommandOptionsAfterRun})
    await executeCommandAsync(cmd)
    expect(holder.cmd).to.eq(cmd)
  })
})