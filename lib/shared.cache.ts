import { isString, isNumber } from 'sat-utils';
import { logger } from './logger';

type TSharedCache = { [scope: string]: unknown[] };
type TSharedCacheVia = 'arg' | 'env';

const USE_SHARED_CACHE_ARG = /--use-shared-cache=(?:"([^"]*)"|'([^']*)'|(\S+))/;
// same match but eats a leading space so removing the argument leaves no double space
const USE_SHARED_CACHE_ARG_STRIP = /\s*--use-shared-cache=(?:"([^"]*)"|'([^']*)'|(\S+))/;

// name of the environment variable used when entities are delivered via `env`
const SHARED_CACHE_ENV_VAR = 'PROCESS_RERUN_CACHE';

/**
 * Stores an entity published by a command on its stdout (see `getCache` in ./exec)
 * into the shared cache, grouped by scope. Every published entity is appended, so a
 * scope accumulates a list of entities across commands.
 */
function addToSharedCache(cache: TSharedCache, published: { scope: string; data: any }) {
  if (!published || !isString(published.scope)) {
    logger.warn('shared-cache payload should be an object with { scope: string, data: any }');
    return;
  }
  const { scope, data } = published;
  if (cache[scope]) cache[scope].push(data);
  else cache[scope] = [data];
}

/**
 * Prefills the shared cache with entities supplied before the execution starts
 * (the `sharedCache` build option), so commands can consume them via
 * --use-shared-cache without any producer process. Entities are appended to the
 * scopes that already exist; the caller's arrays are copied, never consumed.
 */
function prefillSharedCache(cache: TSharedCache, initial?: TSharedCache) {
  if (!initial) return;
  if (typeof initial !== 'object' || Array.isArray(initial)) {
    logger.warn('sharedCache option should be an object of { [scope: string]: unknown[] }');
    return;
  }
  for (const [scope, entities] of Object.entries(initial)) {
    if (!Array.isArray(entities)) {
      logger.warn(`sharedCache entities for scope "${scope}" should be an array`);
      continue;
    }
    if (cache[scope]) cache[scope].push(...entities);
    else cache[scope] = [...entities];
  }
}

/**
 * A command can request entities produced by earlier commands via a
 *   --use-shared-cache={"<scope>": <amount>, ...}
 * argument, where each key is a cache scope and each number is how many entities
 * to take from that scope. The requested entities are removed (consumed) from the
 * shared cache and returned grouped by scope. Returns `undefined` when the command
 * does not carry the argument.
 */
function collectSharedCache(cache: TSharedCache, cmd: string): TSharedCache | undefined {
  const match = cmd.match(USE_SHARED_CACHE_ARG);
  if (!match) return undefined;

  const raw = match[1] ?? match[2] ?? match[3];

  let request: { [scope: string]: number };
  try {
    request = JSON.parse(raw);
  } catch {
    logger.warn(`--use-shared-cache value is not a valid json object: ${raw}`);
    return undefined;
  }

  const collected: TSharedCache = {};
  for (const [scope, amount] of Object.entries(request)) {
    if (!isNumber(amount)) {
      logger.warn(`--use-shared-cache amount for scope "${scope}" should be a number`);
      continue;
    }
    const bucket = cache[scope] || [];
    collected[scope] = bucket.splice(0, amount);
  }

  return collected;
}

/**
 * Wraps a value in single quotes so the shell passes it to the child as a single,
 * untouched token. Any single quote inside the value is escaped the POSIX way
 * (close quote, escaped quote, reopen) so the resulting json stays intact and
 * `JSON.parse`-able inside the process regardless of the entity contents.
 */
function shellSingleQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

/**
 * Resolves the --use-shared-cache argument of a command against the shared cache.
 *
 * When entities were gathered they are delivered to the child according to `via`:
 * - `'arg'` (default): the argument is rewritten in place into --cache='<json>' so the
 *   child reads the entities from its argv;
 * - `'env'`: the argument is removed and a `PROCESS_RERUN_CACHE='<json>'` assignment is
 *   prepended to the command so the child reads the entities from its environment.
 *
 * When nothing could be gathered the --use-shared-cache argument is stripped so the child
 * never sees it. Commands without the argument are returned unchanged.
 */
function applySharedCache(cache: TSharedCache, cmd: string, via: TSharedCacheVia = 'arg'): string {
  const collected = collectSharedCache(cache, cmd);

  if (!collected || !Object.values(collected).some(entities => entities.length)) {
    return cmd.replace(USE_SHARED_CACHE_ARG_STRIP, '');
  }

  const value = shellSingleQuote(JSON.stringify(collected));

  if (via === 'env') {
    const withoutRequest = cmd.replace(USE_SHARED_CACHE_ARG_STRIP, '');
    return `${SHARED_CACHE_ENV_VAR}=${value} ${withoutRequest}`;
  }

  return cmd.replace(USE_SHARED_CACHE_ARG, `--cache=${value}`);
}

export { addToSharedCache, prefillSharedCache, collectSharedCache, applySharedCache, SHARED_CACHE_ENV_VAR };
export type { TSharedCache, TSharedCacheVia };
