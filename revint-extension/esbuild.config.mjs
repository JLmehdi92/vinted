import { build, context } from 'esbuild';
import { copyFileSync, mkdirSync, existsSync, readFileSync } from 'fs';

const isWatch = process.argv.includes('--watch');

const shared = {
  bundle: true,
  minify: !isWatch,
  sourcemap: isWatch ? 'inline' : false,
  target: 'chrome120',
  loader: { '.jsx': 'jsx', '.js': 'js', '.css': 'css' },
  jsx: 'automatic',
  jsxImportSource: 'react',
  define: {
    'process.env.NODE_ENV': isWatch ? '"development"' : '"production"',
    'process.env.SUPABASE_URL': '"https://mavmwuyukbesovfionzq.supabase.co"',
    'process.env.SUPABASE_ANON_KEY': '"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdm13dXl1a2Jlc292ZmlvbnpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNDQ3NTYsImV4cCI6MjA4ODgyMDc1Nn0.MYdnMwxiipvqc8UTiW0V7cZ4mr8hZ9nyGtGgTQREtq8"',
  },
};

if (!existsSync('dist/popup')) mkdirSync('dist/popup', { recursive: true });

copyFileSync('src/popup/index.html', 'dist/popup/index.html');
copyFileSync('src/popup/styles.css', 'dist/popup/styles.css');

const configs = [
  {
    ...shared,
    entryPoints: ['src/background/service-worker.js'],
    outfile: 'dist/background.js',
    format: 'iife',
  },
  {
    ...shared,
    entryPoints: ['src/popup/index.jsx'],
    outfile: 'dist/popup/index.js',
    format: 'iife',
    external: [],
  },
  {
    ...shared,
    entryPoints: ['src/content/content.js'],
    outfile: 'dist/content.js',
    format: 'iife',
  },
  {
    ...shared,
    entryPoints: ['src/content/widget.jsx'],
    outfile: 'dist/widget.js',
    format: 'iife',
    define: {
      ...shared.define,
      // Inline the popup CSS as a string constant available to the widget
      '__POPUP_CSS__': JSON.stringify(readFileSync('src/popup/styles.css', 'utf-8')),
    },
  },
  {
    ...shared,
    entryPoints: ['src/content/sell-similar-button.js'],
    outfile: 'dist/sell-similar-button.js',
    format: 'iife',
  },
  {
    ...shared,
    entryPoints: ['src/content/form-filler-bridge.js'],
    outfile: 'dist/form-filler-bridge.js',
    format: 'iife',
  },
  {
    ...shared,
    entryPoints: ['src/content/form-filler.js'],
    outfile: 'dist/form-filler.js',
    format: 'iife',
  },
  {
    ...shared,
    entryPoints: ['src/content/logout-detector.js'],
    outfile: 'dist/logout-detector.js',
    format: 'iife',
  },
];

if (isWatch) {
  for (const config of configs) {
    const ctx = await context(config);
    await ctx.watch();
  }
  console.log('Watching for changes...');
} else {
  await Promise.all(configs.map(c => build(c)));
  console.log('Build complete.');
}
