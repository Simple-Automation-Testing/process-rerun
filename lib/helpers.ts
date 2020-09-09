import * as fs from 'fs';
import * as path from 'path';
import {ProcessRerunError} from './error';

/**
  * @param {string} dir a path to the director what should be read
  * @param {array<string>} fileList option, empty array what will contains all files
  * @param {array<string>} directoryToSkip option, directories what should be exclude from files list
  * @param {boolean} ignoreSubDirs option, directories what should be exclude from files list
  * @returns {array<string>}
  */
const getFilesList = function(dir: string, fileList: string[] = [], directoryToSkip = [], ignoreSubDirs?: boolean) {
  if (!fs.existsSync(dir)) {
    throw new ProcessRerunError('FileSystem', `${dir} does not exists`);
  }

  const files = fs.readdirSync(dir)

  files.forEach(function(file) {
    const isDirr = fs.statSync(path.join(dir, file)).isDirectory()

    const shouldBeExcluded =
      (Array.isArray(directoryToSkip) && directoryToSkip.includes(file)) ||
      (typeof directoryToSkip === 'string' && file.includes(directoryToSkip)) ||
      (directoryToSkip instanceof RegExp && file.match(directoryToSkip))

    if (shouldBeExcluded) {return }

    if (isDirr && !ignoreSubDirs) {
      fileList = getFilesList(path.join(dir, file), fileList, directoryToSkip, ignoreSubDirs)
    } else if (!isDirr) {
      fileList.push(path.join(dir, file))
    }
  });

  return fileList;
}

/**
  * @param {any} timeVal time for setInterval poller
  * @param {number} timeVal time for setInterval poller
  * @returns {number}
*/

const getPollTime = (timeVal) => {
  return typeof timeVal === 'number' && !isNaN(timeVal) && isFinite(timeVal) ? timeVal : 1000;
}
/**
  * await sleep(5000)
  * @param {number} time
  */
const sleep = (time) => new Promise((res) => setTimeout(res, time))

const returnStringType = (arg) => Object.prototype.toString.call(arg)

export {
  getPollTime,
  sleep,
  getFilesList,
  returnStringType
}
