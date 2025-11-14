import type { Options } from '@sentry/bundler-plugin-core';

export interface SentrySourceMapsPluginOptions extends Options {
  /**
   * 简化配置的快捷字段，如果未提供 release.name，则使用该值。
   * 当 release 未配置时，会自动创建 release 配置。
   */
  releaseName?: string;
}

export function resolveBundlerPluginOptions(
  options: SentrySourceMapsPluginOptions = {},
): Options {
  const { releaseName, ...rest } = options;
  const envReleaseName = releaseName ?? process.env.SENTRY_RELEASE;
  const envOrg = process.env.SENTRY_ORG;
  const envProject = process.env.SENTRY_PROJECT;
  const envAuthToken = process.env.SENTRY_AUTH_TOKEN;

  let resolvedRelease = rest.release;

  if (envReleaseName) {
    if (!resolvedRelease) {
      resolvedRelease = { name: envReleaseName };
    } else if (!resolvedRelease.name) {
      resolvedRelease = { ...resolvedRelease, name: envReleaseName };
    }
  }

  return {
    ...rest,
    release: resolvedRelease,
    org: rest.org ?? envOrg,
    project: rest.project ?? envProject,
    authToken: rest.authToken ?? envAuthToken,
  } as Options;
}

