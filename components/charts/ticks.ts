/**
 * Evenly spaced, round axis values from 0 to at least `max`:
 * niceTicks(742) → [0, 200, 400, 600, 800].
 *
 * Steps are 1, 2, 2.5 or 5 times a power of ten, so labels stay easy to read
 * and the top tick is never far above the tallest bar.
 */
export function niceTicks(max: number, intervals = 4): number[] {
  if (!(max > 0)) return [0, 1];
  const rough = max / intervals;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rough) ?? rough;
  const count = Math.ceil(max / step);
  return Array.from({ length: count + 1 }, (_, index) => index * step);
}
