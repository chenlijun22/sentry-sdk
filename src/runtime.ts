// 运行时入口 - 仅包含浏览器环境可用的代码
export { initSentry, Sentry } from './sentry';
export { SentryErrorBoundary } from './integrations/react-error-boundary';
export type { SentryErrorBoundaryProps, FallbackProps } from './integrations/react-error-boundary';
export type { SentryConfig, SentryOptions } from './types';

