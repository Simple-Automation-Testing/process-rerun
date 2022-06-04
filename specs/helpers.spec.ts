import { expect } from 'assertior';
import * as path from 'path';
import { getPollTime, getFilesList } from '../lib/helpers';
import { ProcessRerunError } from '../lib/error';

describe('Helpers spec', () => {
  it('[P] getPollTime', function () {
    expect(getPollTime(1)).toEqual(1);
    expect(getPollTime('')).toEqual(1000);
    expect(getPollTime(Number.NaN)).toEqual(1000);
    expect(getPollTime(Number.POSITIVE_INFINITY)).toEqual(1000);
  });

  it('[P] getFilesList', function () {
    expect(getFilesList(__dirname)).toBeNotEmptyArray();
  });

  it('[P] getFilesList ignoreSubDirs', function () {
    expect(getFilesList(path.resolve(__dirname, '../.github'), [], null, true)).toBeEmptyArray();
  });

  it('[P] getFilesList', function () {
    expect(getFilesList(path.resolve(__dirname, '../.github'))).toBeNotEmptyArray();
  });

  it('[N] getFilesList', function () {
    try {
      getFilesList('/dir/does/not_exists/for_sure');
    } catch (error) {
      expect(error instanceof ProcessRerunError).toEqual(true);
    }
  });
});
