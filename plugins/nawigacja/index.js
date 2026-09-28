/**
 * Entry point for the Nawigacja component plugin.
 *
 * Quartz loads components from the `./components` subpath (see
 * quartz/plugins/loader/componentLoader.ts), so the component itself lives in
 * components.js. This re-export exists so the package also resolves as a plain
 * import.
 */
export { Nawigacja } from "./components.js"
