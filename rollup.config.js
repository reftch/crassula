import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';
import typescript from '@rollup/plugin-typescript';
import html from 'rollup-plugin-html';
import crassulaPreprocess from './src/preprocess/index.ts';

const production = !process.env.ROLLUP_WATCH;

function serve() {
  let server;

  function toExit() {
    if (server) server.kill(0);
  }

  return {
    writeBundle() {
      if (server) return;
      server = require('child_process').spawn('npm', ['run', 'server', '--', '--dev'], {
        stdio: ['ignore', 'inherit', 'inherit'],
        shell: true
      });

      process.on('SIGTERM', toExit);
      process.on('exit', toExit);
    }
  };
}

export default [{
    input: 'src/index.ts',
    output: {
      sourcemap: true,
      format: 'iife',
      name: 'app',
      file: 'public/js/bundle.js'
    },
    plugins: [
      html({
        include: ['**/*.html']
      }),
      crassulaPreprocess(),
      typescript({
        sourceMap: !production,
        inlineSources: !production,
        include: ['**/*.ts']
      }),  
      // In dev mode, call `npm run start` once
      // the bundle has been generated
      !production && serve(),

      // Watch the `public` directory and refresh the
      // browser on changes when not in production
      !production && livereload('public'),

      // If we're building for production (npm run build
      // instead of npm run dev), minify
      production && terser()
    ],
    watch: {
      clearScreen: false
    }
  }
];
