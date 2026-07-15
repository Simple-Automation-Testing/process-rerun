import { isString, isNumber } from 'sat-utils';
import { logger } from './logger';

type TSharedCache = { [scope: string]: unknown[] };

const USE_SHARED_CACHE_ARG = /--use-shared-cache=(?:"([^"]*)"|'([^']*)'|(\S+))/;

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
 * Resolves the --use-shared-cache argument of a command against the shared cache:
 * - if entities were gathered, rewrites the argument into --cache='<json>' so the
 *   child process receives the actual entities via its argv;
 * - otherwise strips the --use-shared-cache argument so the child never sees it.
 * Commands without the argument are returned unchanged.
 */
/**
 * Wraps a value in single quotes so the shell passes it to the child as a single,
 * untouched argument. Any single quote inside the value is escaped the POSIX way
 * (close quote, escaped quote, reopen) so the resulting json stays intact and
 * `JSON.parse`-able inside the process regardless of the entity contents.
 */
function shellSingleQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function applySharedCache(cache: TSharedCache, cmd: string): string {
  const collected = collectSharedCache(cache, cmd);

  if (collected && Object.values(collected).some(entities => entities.length)) {
    return cmd.replace(USE_SHARED_CACHE_ARG, `--cache=${shellSingleQuote(JSON.stringify(collected))}`);
  }

  return cmd.replace(/\s*--use-shared-cache=(?:"([^"]*)"|'([^']*)'|(\S+))/, '');
}

export { addToSharedCache, collectSharedCache, applySharedCache };
export type { TSharedCache };
