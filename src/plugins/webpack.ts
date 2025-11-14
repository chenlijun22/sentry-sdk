import {
  sentryWebpackPlugin as sentryWebpackPluginOriginal,
  sentryCliBinaryExists,
  type SentryWebpackPluginOptions as SentryWebpackPluginOptionsOriginal,
} from '@sentry/webpack-plugin';
import { resolveBundlerPluginOptions, type SentrySourceMapsPluginOptions } from './shared';

export type SentryWebpackPluginOptions = SentrySourceMapsPluginOptions;

/**
 * @sentry/webpack-plugin 文档:
 * https://www.npmjs.com/package/@sentry/webpack-plugin
 */
export function sentryWebpackPlugin(options: SentryWebpackPluginOptions = {}) {
  const normalized = resolveBundlerPluginOptions({
    ...options,
    sourcemaps: {
      filesToDeleteAfterUpload: '**/*.map',
      ...options.sourcemaps,
    },
  }) as SentryWebpackPluginOptionsOriginal;
  return sentryWebpackPluginOriginal(normalized);
}

export const ensureSentryCliBinary = sentryCliBinaryExists;

