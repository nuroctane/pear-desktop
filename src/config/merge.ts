import { deepmergeCustom } from 'deepmerge-ts';

/**
 * Plugin configs frequently store fixed-length arrays (e.g. [x, y] positions,
 * ffmpeg args). The default deepmerge-ts behavior *concatenates* arrays, which
 * corrupts those values on every getConfig/setConfig cycle.
 *
 * Always use this helper when merging plugin defaults with stored overrides.
 */
export const mergeConfig = deepmergeCustom({
  mergeArrays: false,
});
