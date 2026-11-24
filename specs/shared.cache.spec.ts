import { expect } from 'assertior';
import { getCache } from '../lib/exec';
import { addToSharedCache, prefillSharedCache, collectSharedCache, applySharedCache, type TSharedCache } from '../lib/shared.cache';

describe('shared cache - getCache (stdout extraction)', () => {
  it('extracts a json payload emitted as shared-cache: "..."', () => {
    const payload = { scope: 'auth', data: { token: 'abc' } };
    const line = `some log line\nshared-cache: ${JSON.stringify(JSON.stringify(payload))}\nmore logs`;

    expect(getCache(line)).toDeepEqual([payload]);
  });

  it('returns an empty array when there is no shared-cache line', () => {
    expect(getCache('just regular stdout without a cache marker')).toDeepEqual([]);
  });

  it('returns an empty array for a non-string input', () => {
    // @ts-expect-error - guarding runtime behaviour
    expect(getCache(undefined)).toDeepEqual([]);
  });

  it('extracts every shared-cache line, in order, when a process prints several', () => {
    const first = { scope: 'a', data: 1 };
    const second = { scope: 'b', data: 2 };
    const third = { scope: 'a', data: 3 };
    const output = [
      'starting',
      `shared-cache: ${JSON.stringify(JSON.stringify(first))}`,
      'doing work',
      `shared-cache: ${JSON.stringify(JSON.stringify(second))}`,
      `shared-cache: ${JSON.stringify(JSON.stringify(third))}`,
      'done',
    ].join('\n');

    expect(getCache(output)).toDeepEqual([first, second, third]);
  });

  it('falls back to the decoded string when the payload is not json', () => {
    expect(getCache('shared-cache: "plain string"')).toDeepEqual(['plain string']);
  });
});

describe('shared cache - addToSharedCache (producer side)', () => {
  it('creates a scope list for the first published entity', () => {
    const cache: TSharedCache = {};
    addToSharedCache(cache, { scope: 'auth', data: { token: 'a' } });

    expect(cache).toDeepEqual({ auth: [{ token: 'a' }] });
  });

  it('appends further entities to an existing scope', () => {
    const cache: TSharedCache = {};
    addToSharedCache(cache, { scope: 'auth', data: 1 });
    addToSharedCache(cache, { scope: 'auth', data: 2 });
    addToSharedCache(cache, { scope: 'other', data: 3 });

    expect(cache).toDeepEqual({ auth: [1, 2], other: [3] });
  });

  it('ignores a payload without a string scope', () => {
    const cache: TSharedCache = {};
    // @ts-expect-error - guarding runtime behaviour
    addToSharedCache(cache, { data: 1 });
    // @ts-expect-error - guarding runtime behaviour
    addToSharedCache(cache, undefined);

    expect(cache).toDeepEqual({});
  });
});

describe('shared cache - collectSharedCache (consumer side)', () => {
  it('returns undefined when the command has no --use-shared-cache argument', () => {
    const cache: TSharedCache = { auth: [1, 2] };
    expect(collectSharedCache(cache, 'node run.js')).toEqual(undefined);
    // cache is untouched
    expect(cache).toDeepEqual({ auth: [1, 2] });
  });

  it('consumes the requested amount of entities per scope', () => {
    const cache: TSharedCache = { auth: [1, 2, 3], user: ['a', 'b'] };
    const collected = collectSharedCache(cache, 'node run.js --use-shared-cache={"auth":2,"user":1}');

    expect(collected).toDeepEqual({ auth: [1, 2], user: ['a'] });
    // taken entities are removed from the shared cache
    expect(cache).toDeepEqual({ auth: [3], user: ['b'] });
  });

  it('takes only what is available when the amount exceeds the bucket', () => {
    const cache: TSharedCache = { auth: [1] };
    const collected = collectSharedCache(cache, 'node run.js --use-shared-cache={"auth":5}');

    expect(collected).toDeepEqual({ auth: [1] });
    expect(cache).toDeepEqual({ auth: [] });
  });

  it('yields an empty list for an unknown scope', () => {
    const cache: TSharedCache = {};
    const collected = collectSharedCache(cache, 'node run.js --use-shared-cache={"missing":2}');

    expect(collected).toDeepEqual({ missing: [] });
  });

  it('supports bare and single-quoted argument values', () => {
    const bare: TSharedCache = { auth: [1, 2] };
    expect(collectSharedCache(bare, `node run.js --use-shared-cache={"auth":1}`)).toDeepEqual({ auth: [1] });

    const single: TSharedCache = { auth: [1, 2] };
    expect(collectSharedCache(single, `node run.js --use-shared-cache='{"auth":1}'`)).toDeepEqual({ auth: [1] });
  });

  it('skips scopes whose amount is not a number', () => {
    const cache: TSharedCache = { auth: [1, 2] };
    const collected = collectSharedCache(cache, 'node run.js --use-shared-cache={"auth":"two"}');

    expect(collected).toDeepEqual({});
    expect(cache).toDeepEqual({ auth: [1, 2] });
  });

  it('returns undefined for an invalid json value', () => {
    const cache: TSharedCache = { auth: [1, 2] };
    expect(collectSharedCache(cache, 'node run.js --use-shared-cache=not-json')).toEqual(undefined);
    expect(cache).toDeepEqual({ auth: [1, 2] });
  });
});

describe('shared cache - applySharedCache (command rewrite)', () => {
  it('rewrites --use-shared-cache into --cache with the gathered entities', () => {
    const cache: TSharedCache = { auth: [{ token: 'a' }] };
    const cmd = applySharedCache(cache, 'node run.js --use-shared-cache={"auth":1}');

    expect(cmd).toEqual(`node run.js --cache='{"auth":[{"token":"a"}]}'`);
    expect(cache).toDeepEqual({ auth: [] });
  });

  it('strips the argument when nothing could be gathered', () => {
    const cache: TSharedCache = {};
    const cmd = applySharedCache(cache, 'node run.js --use-shared-cache={"auth":1} --flag');

    expect(cmd).toEqual('node run.js --flag');
  });

  it('leaves a command without the argument unchanged', () => {
    const cache: TSharedCache = { auth: [1] };
    expect(applySharedCache(cache, 'node run.js --flag')).toEqual('node run.js --flag');
  });

  it('escapes single quotes in entity data so the shell keeps the json intact', () => {
    const cache: TSharedCache = { names: [{ name: "O'Brien" }] };
    const cmd = applySharedCache(cache, 'node run.js --use-shared-cache={"names":1}');

    // the inner single quote is POSIX-escaped ('\'') so the shell hands the child valid json
    expect(cmd).toEqual(`node run.js --cache='{"names":[{"name":"O'\\''Brien"}]}'`);
  });

  it('delivers entities through a prepended env assignment when via is "env"', () => {
    const cache: TSharedCache = { auth: [{ token: 'a' }] };
    const cmd = applySharedCache(cache, 'node run.js --use-shared-cache={"auth":1}', 'env');

    // the request flag is removed and the json is exposed via PROCESS_RERUN_CACHE
    expect(cmd).toEqual(`PROCESS_RERUN_CACHE='{"auth":[{"token":"a"}]}' node run.js`);
  });

  it('strips the argument (no env assignment) when nothing is gathered in env mode', () => {
    const cache: TSharedCache = {};
    const cmd = applySharedCache(cache, 'node run.js --use-shared-cache={"auth":1} --flag', 'env');

    expect(cmd).toEqual('node run.js --flag');
  });
});

describe('shared cache - prefillSharedCache', () => {
  it('seeds empty scopes and appends to existing ones', () => {
    const cache: TSharedCache = { a: [1] };
    prefillSharedCache(cache, { a: [2, 3], b: ['x'] });
    expect(cache).toDeepEqual({ a: [1, 2, 3], b: ['x'] });
  });

  it('does not mutate the arrays it was given when entities are consumed', () => {
    const initial = { a: [1, 2] };
    const cache: TSharedCache = {};
    prefillSharedCache(cache, initial);
    collectSharedCache(cache, 'cmd --use-shared-cache={"a":2}');
    expect(initial).toDeepEqual({ a: [1, 2] });
    expect(cache).toDeepEqual({ a: [] });
  });

  it('does not mutate the arrays it was given when the cache scope is appended to later', () => {
    const initial = { a: [1] };
    const cache: TSharedCache = {};
    prefillSharedCache(cache, initial);
    addToSharedCache(cache, { scope: 'a', data: 2 });
    expect(initial).toDeepEqual({ a: [1] });
    expect(cache).toDeepEqual({ a: [1, 2] });
  });

  it('keeps entity order so prefilled entities are consumed first-in first-out', () => {
    const cache: TSharedCache = {};
    prefillSharedCache(cache, { auth: [{ userId: 7 }, { userId: 8 }, { userId: 9 }] });
    expect(collectSharedCache(cache, 'cmd --use-shared-cache={"auth":1}')).toDeepEqual({ auth: [{ userId: 7 }] });
    expect(collectSharedCache(cache, 'cmd --use-shared-cache={"auth":2}')).toDeepEqual({
      auth: [{ userId: 8 }, { userId: 9 }],
    });
    expect(collectSharedCache(cache, 'cmd --use-shared-cache={"auth":1}')).toDeepEqual({ auth: [] });
  });

  it('serves prefilled entities before entities published during the run', () => {
    const cache: TSharedCache = {};
    prefillSharedCache(cache, { auth: ['seeded'] });
    addToSharedCache(cache, { scope: 'auth', data: 'published' });
    expect(collectSharedCache(cache, 'cmd --use-shared-cache={"auth":2}')).toDeepEqual({
      auth: ['seeded', 'published'],
    });
  });

  it('prefills several scopes and lets one command request them together', () => {
    const cache: TSharedCache = {};
    prefillSharedCache(cache, { a: [1, 2], b: ['x'] });
    expect(collectSharedCache(cache, 'cmd --use-shared-cache={"a":1,"b":1}')).toDeepEqual({ a: [1], b: ['x'] });
    expect(cache).toDeepEqual({ a: [2], b: [] });
  });

  it('accepts an empty scope list without creating entities', () => {
    const cache: TSharedCache = {};
    prefillSharedCache(cache, { a: [] });
    expect(cache).toDeepEqual({ a: [] });
    expect(applySharedCache(cache, 'cmd --use-shared-cache={"a":1}')).toEqual('cmd');
  });

  it('feeds prefilled entities into the --cache argument rewrite', () => {
    const cache: TSharedCache = {};
    prefillSharedCache(cache, { auth: [{ token: 'abc' }] });
    expect(applySharedCache(cache, 'cmd --use-shared-cache={"auth":1}')).toEqual(
      `cmd --cache='{"auth":[{"token":"abc"}]}'`,
    );
  });

  it('feeds prefilled entities into the env assignment when via is "env"', () => {
    const cache: TSharedCache = {};
    prefillSharedCache(cache, { auth: [{ token: 'abc' }] });
    expect(applySharedCache(cache, 'cmd --use-shared-cache={"auth":1}', 'env')).toEqual(
      `PROCESS_RERUN_CACHE='{"auth":[{"token":"abc"}]}' cmd`,
    );
  });

  it('ignores non-object input (array, primitive, null)', () => {
    const cache: TSharedCache = { a: [1] };
    // @ts-expect-error - guarding runtime behaviour
    prefillSharedCache(cache, [1, 2]);
    // @ts-expect-error - guarding runtime behaviour
    prefillSharedCache(cache, 'nope');
    // @ts-expect-error - guarding runtime behaviour
    prefillSharedCache(cache, null);
    expect(cache).toDeepEqual({ a: [1] });
  });

  it('ignores missing/invalid input and non-array scopes', () => {
    const cache: TSharedCache = {};
    prefillSharedCache(cache, undefined);
    // @ts-expect-error - guarding runtime behaviour
    prefillSharedCache(cache, { a: 'nope', b: [1] });
    expect(cache).toDeepEqual({ b: [1] });
  });
});
