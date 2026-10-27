import { createSeed, type Db } from "./seed";
import { lagosDay } from "./time";

const store = globalThis as typeof globalThis & { __bbbMockDb?: Db };

/**
 * The mock "database": the seed, built on first use and rebuilt each new
 * (Lagos) day so that "yesterday" and "due in 2 days" stay true.
 *
 * It lives on `globalThis` because in development Next re-evaluates modules
 * on every edit; a plain module variable would wipe any change made through
 * the API each time a file was saved.
 */
export function getDb(now: Date): Db {
  if (store.__bbbMockDb?.day !== lagosDay(now)) {
    store.__bbbMockDb = createSeed(now);
  }
  return store.__bbbMockDb;
}
