import {expect} from 'assertior';
import {execute} from '../lib/exec';
import {sleep} from '../lib/helpers';
import {ProcessRerunError} from '../lib/error';

function wrap(...args) {
  // @ts-ignore
  return execute(...args);
}

test('[P] exec', async function() {
  const holder = {stackTrace: ''};

  async function waiter() {
    do {
      await sleep(1)
    } while (!holder.stackTrace);
  }

  wrap(`node -e 'console.log("Hello")'`, holder);
  //
  await waiter()

  expect(holder.stackTrace).stringIncludesSubstring('Hello');
});

test('[N] exec', async function() {
  const holder = {stackTrace: ''};
  try {
    wrap({}, holder);
  } catch (error) {
    expect(error instanceof ProcessRerunError).toEqual(true);
  }
});

