const {expect} = require('chai')

const {buildCommandExecutor} = require('../lib/commandExecutorBuilder')

describe('buildCommandExecutor', () => {

  it('addSpecificOptionsBeforeRun', async () => {
    {
      const cmd = 'node -e "console.log(\'test\')"'
      const failedByAssert = []
      let holder = null

      const addSpecificOptionsBeforeRun = (cmd) => {
        const reformatedCmd = `${cmd} && echo "FOO"`
        holder = {cmd: reformatedCmd}
        const cmdExecutableCB = () => {holder.exec = true}
        return {cmd, cmdExecutableCB}
      }

      const executeCommandAsync = buildCommandExecutor(failedByAssert, {addSpecificOptionsBeforeRun})
      await executeCommandAsync(cmd)
      expect(holder.cmd).to.eq(`${cmd} && echo "FOO"`)
      expect(holder.exec).to.eq(undefined)
    }
    {
      const cmd = 'node -e "console.log(\'test\'); process.exit(100)"'
      const failedByAssert = []
      let holder = null

      const addSpecificOptionsBeforeRun = (cmd) => {
        const reformatedCmd = `${cmd} && echo "FOO"`
        holder = {cmd: reformatedCmd}
        const cmdExecutableCB = () => {holder.exec = true}
        return {cmd, cmdExecutableCB}
      }

      const executeCommandAsync = buildCommandExecutor(failedByAssert, {addSpecificOptionsBeforeRun})
      await executeCommandAsync(cmd)
      expect(holder.cmd).to.eq(`${cmd} && echo "FOO"`)
      expect(holder.exec).to.eq(true)
    }
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
    expect(holder.stack).to.eql('test\n')
  })

  it('stackAnalize', async () => {
    const failedByAssert = []
    let holder = null
    const cmd = `node -e "console.log('test'); process.exit(1)"`

    const addCommandOptionsAfterRun = (cmd, stack) => {
      if(!holder) holder = {}
      holder.cmd = cmd
      holder.stack = stack
    }
    const stackAnalize = (stack) => {
      holder = {}
      holder.fromStackAnalize = stack
      return false
    }
    const executeCommandAsync = buildCommandExecutor(failedByAssert, {
      addCommandOptionsAfterRun, stackAnalize
    })
    await executeCommandAsync(cmd)
    expect(holder.fromStackAnalize).to.eq('test\n')
    expect(holder.cmd).to.eq(cmd)
    expect(holder.stack).to.eq('test\n')
  })

  it('longestProcessTime', async () => {
    {
      const failedByAssert = []
      let holder = null
      const stackAnalize = (stack) => {
        holder = {}
        holder.fromStackAnalize = stack
        return false
      }
      const cmd = `node -e "(async function() {await new Promise((res) => setTimeout(() => {
        res(process.exit(1))
      }, 25000))})()"`

      const executeCommandAsync = buildCommandExecutor(failedByAssert, {stackAnalize, longestProcessTime: 1})
      await executeCommandAsync(cmd)
      expect(holder).to.eq(null)
    }
    {
      const failedByAssert = []
      let holder = null
      const stackAnalize = (stack) => {
        holder = {}
        holder.fromStackAnalize = stack
        return false
      }
      const cmd = `node -e "(async function() {await new Promise((res) => setTimeout(() => {
        res(process.exit(1))
      }, 1))})()"`

      const executeCommandAsync = buildCommandExecutor(failedByAssert, {stackAnalize, longestProcessTime: 10000})
      await executeCommandAsync(cmd)
      expect(holder).to.not.eq(null)
    }
  })

  it('currentExecutionVariable', async () => {
    const failedByAssert = []
    let holder = null
    const cmd = `node -e "console.log('test'); process.exit(1)"`

    const stackAnalize = (stack) => {
      holder = {}
      holder.fromStackAnalize = stack
      return false
    }

    const addCommandOptionsAfterRun = (cmd, stack) => {
      if(!holder) holder = {}
      holder.cmd = cmd
      holder.stack = stack
    }
    const currentExecutionVariable = 'CURRENT_COUNT'

    const executeCommandAsync = buildCommandExecutor(failedByAssert, {
      stackAnalize,
      addCommandOptionsAfterRun,
      currentExecutionVariable
    })

    const expetedReformatedCommandFirstIteration = `${currentExecutionVariable}=${1} ${cmd}`
    const expetedReformatedCommandSecondIteration = `${currentExecutionVariable}=${2} ${cmd}`

    // first iteration
    await executeCommandAsync(cmd, 1)

    expect(holder.fromStackAnalize).to.eq('test\n')
    expect(holder.cmd).to.eq(expetedReformatedCommandFirstIteration)
    expect(holder.stack).to.eq('test\n')

    await executeCommandAsync(expetedReformatedCommandFirstIteration, 2)

    expect(holder.fromStackAnalize).to.eq('test\n')
    expect(holder.cmd).to.eq(expetedReformatedCommandSecondIteration)
    expect(holder.stack).to.eq('test\n')

  })
})