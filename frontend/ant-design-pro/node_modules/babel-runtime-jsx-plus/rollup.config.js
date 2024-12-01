import babel from 'rollup-plugin-babel';
import replace from 'rollup-plugin-replace';
import filesize from 'rollup-plugin-filesize';
import { uglify } from 'rollup-plugin-uglify';
import { name } from './package.json';

const babelConfig = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: 'iOS >= 8',
        loose: true,
        include: ['transform-computed-properties'],
      },
    ],
  ],
};


export default {
  input: 'src/index.js',
  output: [
    {
      file: `dist/${name}.umd.js`,
      format: 'umd',
      name,
    }
  ],
  plugins: [
    replace({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
    }),
    babel(babelConfig),
    uglify(),
    filesize(),
  ],
};
