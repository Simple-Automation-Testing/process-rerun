import * as fs from 'fs';
import * as path from 'path';
import {ProcessRerunError} from './error';

const getFilesList = function(dir: string, fileList: string[] = [], directoryToSkip: string[] = [], ignoreSubDirs?: boolean): string[] {
  if (!fs.existsSync(dir)) {
    throw new ProcessRerunError('FileSystem', `${dir} does not exists`);
  }

  const files = fs.readdirSync(dir);

  files.forEach(function(file) {
    const isDirr = fs.statSync(path.join(dir, file)).isDirectory();

    const shouldBeExcluded =
      (Array.isArray(directoryToSkip) && directoryToSkip.includes(file)) ||
      (typeof directoryToSkip === 'string' && file.includes(directoryToSkip)) ||
      (directoryToSkip instanceof RegExp && file.match(directoryToSkip));

    if (shouldBeExcluded) {return }

    if (isDirr && !ignoreSubDirs) {
      fileList = getFilesList(path.join(dir, file), fileList, directoryToSkip, ignoreSubDirs);
    } else if (!isDirr) {
      fileList.push(path.join(dir, file));
    }
  });

  return fileList;
}

function getPollTime(timeVal: any): number {
  return typeof timeVal === 'number' && !isNaN(timeVal) && isFinite(timeVal) ? timeVal : 1000;
}

function sleep(time: number): Promise<void> {
  return new Promise((res) => setTimeout(res, time));
}

function returnStringType(arg: any): string {
  return Object.prototype.toString.call(arg);
}

export {
  getPollTime,
  sleep,
  getFilesList,
  returnStringType
}
