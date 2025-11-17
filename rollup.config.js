import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import { readFileSync } from 'fs';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));

// 运行时依赖（不包含构建插件）
const runtimeExternals = [
  'react',
  'react-dom',
  '@sentry/react',
  'react-error-boundary',
];

// 构建插件依赖
const pluginExternals = [
  ...runtimeExternals,
  '@sentry/vite-plugin',
  '@sentry/webpack-plugin',
  '@sentry/bundler-plugin-core',
];

export default [
  // 主入口（运行时功能，与 runtime 相同）
  {
    input: 'src/index.ts',
    output: [
      {
        file: packageJson.main,
        format: 'cjs',
        sourcemap: true,
      },
      {
        file: packageJson.module,
        format: 'esm',
        sourcemap: true,
      },
    ],
    plugins: [
      resolve({
        browser: true,
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        exclude: ['**/*.test.*', '**/*.spec.*'],
      }),
    ],
    external: runtimeExternals,
  },
  // 运行时入口（仅浏览器环境，不包含构建插件）
  {
    input: 'src/runtime.ts',
    output: [
      {
        file: 'dist/runtime.js',
        format: 'cjs',
        sourcemap: true,
      },
      {
        file: 'dist/runtime.esm.js',
        format: 'esm',
        sourcemap: true,
      },
    ],
    plugins: [
      resolve({
        browser: true,
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        exclude: ['**/*.test.*', '**/*.spec.*'],
      }),
    ],
    external: [
      'react',
      'react-dom',
      '@sentry/react',
      'react-error-boundary',
    ],
  },
  // Vite 插件入口
  {
    input: 'src/vite.ts',
    output: [
      {
        file: 'dist/vite.cjs',
        format: 'cjs',
        sourcemap: true,
      },
      {
        file: 'dist/vite.esm.js',
        format: 'esm',
        sourcemap: true,
      },
    ],
    plugins: [
      resolve({
        browser: false,
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        exclude: ['**/*.test.*', '**/*.spec.*'],
      }),
    ],
    external: pluginExternals,
  },
  // Webpack 插件入口
  {
    input: 'src/webpack.ts',
    output: [
      {
        file: 'dist/webpack.cjs',
        format: 'cjs',
        sourcemap: true,
      },
      {
        file: 'dist/webpack.esm.js',
        format: 'esm',
        sourcemap: true,
      },
    ],
    plugins: [
      resolve({
        browser: false,
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        exclude: ['**/*.test.*', '**/*.spec.*'],
      }),
    ],
    external: pluginExternals,
  },
  // 主入口类型定义
  {
    input: 'dist/index.d.ts',
    output: [{ file: 'dist/index.d.ts', format: 'esm' }],
    plugins: [dts()],
    external: runtimeExternals,
  },
  // 运行时类型定义
  {
    input: 'dist/runtime.d.ts',
    output: [{ file: 'dist/runtime.d.ts', format: 'esm' }],
    plugins: [dts()],
    external: runtimeExternals,
  },
  // Vite 插件类型定义
  {
    input: 'dist/vite.d.ts',
    output: [{ file: 'dist/vite.d.ts', format: 'esm' }],
    plugins: [dts()],
    external: pluginExternals,
  },
  // Webpack 插件类型定义
  {
    input: 'dist/webpack.d.ts',
    output: [{ file: 'dist/webpack.d.ts', format: 'esm' }],
    plugins: [dts()],
    external: pluginExternals,
  },
];

