export {
  sentryVitePlugin,
  type SentryVitePluginOptions,
} from './vite';
export {
  sentryWebpackPlugin,
  type SentryWebpackPluginOptions,
} from './webpack';
export type { SentrySourceMapsPluginOptions } from './shared';
export { sentryCliBinaryExists as ensureSentryCliBinary } from '@sentry/bundler-plugin-core';

