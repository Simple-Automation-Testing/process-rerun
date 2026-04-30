import { expect } from 'assertior';
import { ProcessRerunError } from '../lib/error';
import { execute } from '../lib/exec';
import { sleep } from '../lib/helpers';

function wrap(...args) {
  // @ts-expect-error
  return execute(...args);
}

describe('exec intex', () => {
  it('[P] exec', async () => {
    const holder = { stackTrace: '' };

    async function waiter() {
      do {
        await sleep(1);
      } while (!holder.stackTrace);
    }

    wrap(`node -e 'console.log("Hello")'`, () => {}, holder);
    //
    await waiter();

    expect(holder.stackTrace).stringIncludesSubstring('Hello');
  });

  it('[N] exec', async () => {
    const holder = { stackTrace: '' };
    try {
      wrap({}, holder);
    } catch (error) {
      expect(error instanceof ProcessRerunError).toEqual(true);
    }
  });
});
