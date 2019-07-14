const {expect} = require('chai')

const {buildCommandExecutor} = require('../../lib/commandExecutorBuilder')

describe('buildCommandExecutor spawn', () => {

  it('addSpecificOptionsBeforeRun', async () => {
    {
      const cmd = {command: 'node', args: ['-e', "console.log(\'test\')"]}
      const failedByAssert = []
      let holder = null

      const addSpecificOptionsBeforeRun = (cmd) => {
        cmd.args.push('&&', 'echo', '"FOO"')
        holder = {}
        holder.cmd = {...cmd}
        const cmdExecutableCB = () => {holder.exec = true}
        return {cmd, cmdExecutableCB}
      }

      const executeCommandAsync = buildCommandExecutor(failedByAssert, {spawn: true, addSpecificOptionsBeforeRun})
      await executeCommandAsync(cmd)
      expect(holder.cmd.args).to.contains('&&')
      expect(holder.cmd.args).to.contains('echo')
      expect(holder.cmd.args).to.contains('"FOO"')
      expect(holder.exec).to.eq(undefined)
    }
    {
      const cmd = {command: 'node', args: ['-e', "console.log(\'test\'); process.exit(100)"]}
      const failedByAssert = []
      let holder = null

      const addSpecificOptionsBeforeRun = (cmd) => {
        cmd.args.push('&&', 'echo', '"FOO"')
        holder = {}
        holder.cmd = {...cmd}
        const cmdExecutableCB = () => {holder.exec = true}
        return {cmd, cmdExecutableCB}
      }

      const executeCommandAsync = buildCommandExecutor(failedByAssert, {spawn: true, addSpecificOptionsBeforeRun})
      await executeCommandAsync(cmd)
      expect(holder.cmd.args).to.contains('&&')
      expect(holder.cmd.args).to.contains('echo')
      expect(holder.cmd.args).to.contains('"FOO"')
      expect(holder.exec).to.eq(true)
    }
  })

  it('reformatCommand', async () => {
    const failedByAssert = []
    let holder = null

    const cmd = {command: 'node', args: ['-e', "console.log(\'test\'); process.exit(1)"]}

    const reformatCommand = (cmd, stack) => {
      holder = {}
      holder.cmd = cmd
      holder.stack = stack
    }

    const executeCommandAsync = buildCommandExecutor(failedByAssert, {spawn: true, reformatCommand})
    await executeCommandAsync(cmd)
    expect(holder.cmd).to.eq(cmd)
    expect(holder.stack).to.eql('test\n')
  })

  it('stackAnalize', async () => {
    const failedByAssert = []
    let holder = null

    const cmd = {command: 'node', args: ['-e', "console.log('test'); process.exit(1)"]}

    const reformatCommand = (cmd, stack) => {
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
      spawn: true,
      reformatCommand,
      stackAnalize
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
      const cmd = {
        command: 'node', args: ['-e', `(async function() {await new Promise((res) => setTimeout(() => {
            res(process.exit(1))
          }, 25000))})()`
        ]
      }

      const executeCommandAsync = buildCommandExecutor(failedByAssert, {
        spawn: true,
        stackAnalize,
        longestProcessTime: 1
      })
      await executeCommandAsync(cmd)
      expect(holder).to.eql({fromStackAnalize: ''})
    }
    {
      const failedByAssert = []
      let holder = null
      const stackAnalize = (stack) => {
        holder = {}
        holder.fromStackAnalize = stack
        return false
      }
      const cmd = {
        command: 'node', args: ['-e', `(async function() {await new Promise((res) => setTimeout(() => {
            res(process.exit(1))
          }, 25000))})()`
        ]
      }

      const executeCommandAsync = buildCommandExecutor(failedByAssert, {
        spawn: true,
        stackAnalize,
        longestProcessTime: 10000
      })
      await executeCommandAsync(cmd)
      expect(holder).to.not.eq(null)
    }
  })
})