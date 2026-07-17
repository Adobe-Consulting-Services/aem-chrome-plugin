import * as esbuild from 'esbuild';

const watch = process.argv.includes('--watch');

const options = {
  entryPoints: [
    { in: 'src/background/index.js', out: 'background' },
    { in: 'src/devtools/devtools.js', out: 'devtools' },
    { in: 'src/panel/panel.js', out: 'panel' },
    { in: 'src/options/options.js', out: 'options' },
  ],
  outdir: 'dist',
  bundle: true,
  format: 'esm',
  splitting: true,
  sourcemap: true,
  target: 'chrome100',
};

if (watch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  console.log('esbuild watching for changes...');
} else {
  await esbuild.build(options);
  console.log('esbuild build complete.');
}
