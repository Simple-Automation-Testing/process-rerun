import { expect } from 'assertior';
import { getPollTime } from '../lib/helpers';

describe('Helpers spec', () => {
  it('[P] getPollTime', function () {
    expect(getPollTime(1)).toEqual(1);
    expect(getPollTime('')).toEqual(1000);
    expect(getPollTime(Number.NaN)).toEqual(1000);
    expect(getPollTime(Number.POSITIVE_INFINITY)).toEqual(1000);
  });
});
