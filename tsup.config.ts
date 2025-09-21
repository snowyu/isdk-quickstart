import { defineConfig } from 'tsup'

const outDir = 'dist';

export default defineConfig({
  tsconfig: 'tsconfig.build.json',
  entry: ['src/index.ts', 'src/adv_run.ts'],
  format: ['esm'],
  outDir,
  dts: true, // Enable generating .d.ts files
  // Inject cjs and esm shims:https://tsup.egoist.dev/#inject-cjs-and-esm-shims
  shims: false,
  splitting: false,
  // sourcemap: true,
  // clean: true,
  minify: 'terser',
  terserOptions: {
    // compress: {
    //   drop_console: true,
    //   drop_debugger: true,
    // },
    // https://terser.org/docs/options/#mangle-options
    "mangle": {
      "properties": {
        "regex": /^_[$]/,
        // "undeclared": true, // Mangle those names when they are accessed as properties of known top level variables but their declarations are never found in input code.
      },
      "toplevel": true,
      "reserved": [
        // # expected names in web-extension content
        "WeakSet", "Set",
        // # expected names in 3rd-party extensions' contents
        "requestIdleCallback",
        // # content global names:
        "browser",
      ],
    }
  },
})
