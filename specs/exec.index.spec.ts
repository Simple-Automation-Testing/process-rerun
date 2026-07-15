import { expect } from 'assertior';
import { ProcessRerunError } from '../lib/error';
import { execute } from '../lib/exec';
import { sleep } from '../lib/helpers';

function wrap(arg) {
  // @ts-expect-error
  return execute(arg);
}

describe('exec intex', () => {
  it('[P] exec', async () => {
    const holder = { stackTrace: '' };

    async function waiter() {
      do {
        await sleep(1);
      } while (!holder.stackTrace);
    }

    execute({ cmd: `node -e 'console.log("Hello")'`, logProcessResult: () => {}, executionHolder: holder });
    //
    await waiter();

    expect(holder.stackTrace).stringIncludesSubstring('Hello');
  });

  it('[N] exec', async () => {
    try {
      wrap({});
    } catch (error) {
      expect(error instanceof ProcessRerunError).toEqual(true);
    }
  });
});
