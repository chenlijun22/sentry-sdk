// Webpack 插件入口
export {
  sentryWebpackPlugin,
  type SentryWebpackPluginOptions,
} from './plugins/webpack';
export type { SentrySourceMapsPluginOptions } from './plugins/shared';
export { ensureSentryCliBinary } from './plugins/webpack';

