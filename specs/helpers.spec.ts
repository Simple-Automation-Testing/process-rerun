import {expect} from 'assertior';
import * as path from 'path';
import {getPollTime, returnStringType, getFilesList} from '../lib/helpers';
import {ProcessRerunError} from '../lib/error';

test('[P] getPollTime', function() {
  expect(getPollTime(1)).toEqual(1);
  expect(getPollTime('')).toEqual(1000);
  expect(getPollTime(NaN)).toEqual(1000);
  expect(getPollTime(Infinity)).toEqual(1000);
});

test('[P] returnStringType', function() {
  expect(returnStringType('')).toEqual('[object String]');
});

test('[P] getFilesList', function() {
  expect(getFilesList(__dirname)).toBeNotEmptyArray();
});

test('[P] getFilesList ignoreSubDirs', function() {
  expect(getFilesList(
    path.resolve(__dirname, '../node_modules'),
    [],
    null,
    true
  )).toBeEmptyArray();
});

test('[P] getFilesList', function() {
  expect(getFilesList(
    path.resolve(__dirname, '../node_modules'),
  )).toBeNotEmptyArray();
});

test('[N] getFilesList', function() {
  try {
    getFilesList('/dir/does/not_exists/for_sure');
  } catch (error) {
    expect(error instanceof ProcessRerunError).toEqual(true);
  }
});
