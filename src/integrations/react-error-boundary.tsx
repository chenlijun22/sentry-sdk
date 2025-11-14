import React, { useCallback } from 'react';
import * as Sentry from '@sentry/react';
import {
  ErrorBoundary as ReactErrorBoundary,
  type ErrorBoundaryPropsWithFallback,
  type FallbackProps,
} from 'react-error-boundary';

type ScopeFromCapture = Parameters<typeof Sentry.captureException>[1] extends (
  scope: infer T,
) => unknown
  ? T
  : Sentry.Scope;

export interface SentryErrorBoundaryProps extends ErrorBoundaryPropsWithFallback {
  /**
   * 在错误捕获前对 Scope 做自定义处理
   */
  beforeCapture?: (scope: ScopeFromCapture, error: Error, info: React.ErrorInfo) => void;
  /**
   * 是否自动上报到 Sentry，默认为 true
   */
  capture?: boolean;
}

export const SentryErrorBoundary: React.FC<SentryErrorBoundaryProps> = ({
  beforeCapture,
  capture = true,
  onError,
  ...rest
}) => {
  const handleError = useCallback<NonNullable<ErrorBoundaryPropsWithFallback['onError']>>(
    (error, errorInfo) => {
      if (capture) {
        Sentry.captureException(error, (scope) => {
          scope.setContext('react-error-boundary', {
            componentStack: errorInfo.componentStack,
          });
          beforeCapture?.(scope as ScopeFromCapture, error, errorInfo);
          return scope;
        });
      }
      onError?.(error, errorInfo);
    },
    [beforeCapture, capture, onError],
  );

  return <ReactErrorBoundary {...rest} onError={handleError} />;
};

export type { FallbackProps } from 'react-error-boundary';

