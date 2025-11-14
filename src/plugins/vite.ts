import {
  sentryVitePlugin as sentryVitePluginOriginal,
  sentryCliBinaryExists,
  type SentryVitePluginOptions as SentryVitePluginOptionsOriginal,
} from "@sentry/vite-plugin";
import {
  resolveBundlerPluginOptions,
  type SentrySourceMapsPluginOptions,
} from "./shared";

export type SentryVitePluginOptions = SentrySourceMapsPluginOptions;

/**
 * @sentry/vite-plugin 文档:
 * https://www.npmjs.com/package/@sentry/vite-plugin
 */

export function sentryVitePlugin(
  options: SentryVitePluginOptions = {}
) {
  const normalized = resolveBundlerPluginOptions({
    ...options,
    sourcemaps: {
      filesToDeleteAfterUpload: '**/*.map',
      ...options.sourcemaps,
    },
  }) as SentryVitePluginOptionsOriginal;
  return sentryVitePluginOriginal(normalized);
}

export const ensureSentryCliBinary = sentryCliBinaryExists;
