// Vite 插件入口
export {
  sentryVitePlugin,
  type SentryVitePluginOptions,
} from './plugins/vite';
export type { SentrySourceMapsPluginOptions } from './plugins/shared';
export { ensureSentryCliBinary } from './plugins/vite';

