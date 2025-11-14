import type * as Sentry from '@sentry/react';

export interface SentryConfig extends Sentry.BrowserOptions {
  debug?: boolean;
  replayCanvas?: boolean;
  environment?: 'production' | 'development' | 'test';
}

export type SentryOptions = Parameters<typeof Sentry.init>[0];

