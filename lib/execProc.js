const {exec} = require('child_process');
const {returnStringType} = require('./helpers');
const {millisecondsToMinutes} = require('./utils')

function buildExecRunner(failedByAssert, runOpts) {
  const {
    addSpecificOptionsBeforeRun,
    currentExecutionVariable,
    longestProcessTime,
    debugProcess,
    reformatCommand,
    stackAnalize,
    execOpts = {maxBuffer: 1000 * 1024}
  } = runOpts;

  return (cmd, index) => new Promise((resolve) => {
    let additionalOpts = null;
    let originalCmd = cmd;
    let specificCallBack = null;
    let executionStack = '';
    /**
     * @now this variable will be used for process kill if time more than @longestProcessTime
     */
    const startTime = +Date.now();

    /**
     * @param {undefined|function} addSpecificOptions if function cmd will go to this function as argument
     */
    if (addSpecificOptionsBeforeRun) {
      const cmdObj = addSpecificOptionsBeforeRun(cmd);
      cmd = cmdObj.cmd;
      specificCallBack = cmdObj.cmdExecutableCB;
      additionalOpts = cmd.replace(originalCmd, '');
    }

    if (currentExecutionVariable) {
      if (cmd.includes(currentExecutionVariable)) {
        cmd = cmd.replace(new RegExp(`${currentExecutionVariable}=\\d+`, 'ig'), `${currentExecutionVariable}=${index}`);
      } else {
        cmd = `${currentExecutionVariable}=${index} ${cmd}`;
      }
    }

    const execProc = exec(cmd, execOpts, (error, stdout, stderr) => {
      if (debugProcess) {
        console.log('___________________________________________________________________________');
        console.log(`command for process:  ${cmd}`);
        console.log(`process duration: ${millisecondsToMinutes(+Date.now() - startTime)}`);
        console.log(`PID: ${execProc.pid}`);
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
        console.error(`error: ${error}`);
        console.log('___________________________________________________________________________');
      }
      executionStack += `${stdout}${stderr}`;
    });

    const killTooLongExecution = (procWhatShouldBeKilled) => {
      const executionTime = +Date.now() - startTime;
      if (executionTime > longestProcessTime) {
        if (debugProcess) {
          console.log(`Process killed due to long time execution: ${millisecondsToMinutes(executionTime)}`);
        }
        procWhatShouldBeKilled.kill();
      }
    };

    const watcher = setInterval(() => killTooLongExecution(execProc), 5000);

    execProc.on('exit', (code, signal) => {
      if (debugProcess) {
        console.log(`EXIT PROCESS: PID="${execProc.pid}", code="${code}" and signal="${signal}"`);
      }
    });

    execProc.on('error', (e) => {
      if (debugProcess) {
        console.log(`ERROR PROCESS: PID="${execProc.pid}"`);
      }
      console.error(e);
    });

    execProc.on('close', async (code, signal) => {
      if (debugProcess) {
        console.log(`CLOSE PROCESS: PID="${execProc.pid}", code="${code}" and signal="${signal}"`);
      }
      // clear watcher interval
      clearInterval(watcher);

      let commandToRerun = null;

      // if process code 0 - exit as a success result
      if (code === 0) {
        resolve(commandToRerun);
        return;
      }
      // stackAnalize - check that stack contains or not contains some specific data
      if (stackAnalize && stackAnalize(executionStack)) {
        commandToRerun = cmd;
      } else if (reformatCommand) {
        commandToRerun = cmd;
      } else {
        failedByAssert.push(cmd);
      }

      // if code === 0 do nothing, success
      if (specificCallBack) {
        if (specificCallBack.then || returnStringType(specificCallBack) === '[object AsyncFunction]') {
          await specificCallBack();
        } else {
          specificCallBack();
        }
      }

      if (reformatCommand && commandToRerun) {
        commandToRerun = reformatCommand(commandToRerun, executionStack, failedByAssert);
      }
      // addSpecificOptionsBeforeRun was defined - we should remove useless opts what will be added in next iteration
      if (commandToRerun && additionalOpts) {
        commandToRerun = commandToRerun.replace(additionalOpts, '');
      }

      resolve(commandToRerun);
    })
  });
}

module.exports = {
  buildExecRunner
};
