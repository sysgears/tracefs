import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';

const extensions = ['.js', '.jsx', '.ts', '.tsx'];

export default {
  input: './src/index.ts',
  external: ['fs', 'os', 'util', 'child_process', 'path'],

  plugins: [resolve({ extensions }), commonjs(), babel({ extensions, include: ['src/**/*'] })],

  output: [
    {
      file: 'lib/bundle.js',
      format: 'cjs',
    },
  ],
};
