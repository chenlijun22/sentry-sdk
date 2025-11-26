// 主入口 - 仅包含运行时功能（与 runtime 相同）
export { initSentry, Sentry, SentryIntegrations } from './sentry';
export { SentryErrorBoundary } from './integrations/react-error-boundary';
export type { SentryErrorBoundaryProps, FallbackProps } from './integrations/react-error-boundary';
export type { SentryConfig, SentryOptions } from './types';

