import React, { createContext, useContext } from "react";
import * as Sentry from "@sentry/react";
import type { SentryConfig } from "./types";


export { Sentry };

// Sentry Context
const SentryContext = createContext<typeof Sentry>(Sentry);

/**
 * 初始化 Sentry
 * @param config Sentry 配置
 */
export function initSentry(config: SentryConfig): void {
  const { beforeSend, replayCanvas, ...options } = config;

  // https://docs.sentry.io/platforms/javascript/configuration/options
  Sentry.init({
    environment: options.environment || process?.env?.NODE_ENV || 'development',
    integrations: [
      Sentry.browserProfilingIntegration(),
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: true,
      }),
      ...(replayCanvas
        ? [
            Sentry.replayCanvasIntegration(),
          ]
        : []),
    ],
    replaysSessionSampleRate: 0.1, // Capture 10% of all sessions
    replaysOnErrorSampleRate: 1.0, // Capture 100% of error sessions

    beforeSend: (event, hint) => {
      if (beforeSend) {
        return beforeSend(event, hint);
      }
      // 1. 删除敏感 request headers
      if (event.request?.headers) {
        delete event.request.headers["Authorization"];
        delete event.request.headers["authorization"];
        delete event.request.headers["Cookie"];
        delete event.request.headers["cookie"];
      }

      // 2. 删除用户 IP
      if (event.user) {
        delete event.user.ip_address;
      }

      // 3. 删掉常见 form/context 数据
      if (event.extra?.formData) delete event.extra.formData;
      if (event.contexts?.data) delete event.contexts.data;

      return event;
    },
    ...options,
  });
}

/**
 * Sentry Provider 组件
 * 用于包裹应用，提供 Sentry 上下文
 */
export interface SentryProviderProps {
  children: React.ReactNode;
  instance?: typeof Sentry;
}

export const SentryProvider: React.FC<SentryProviderProps> = ({
  children,
  instance = Sentry,
}) => {
  return (
    <SentryContext.Provider value={instance}>{children}</SentryContext.Provider>
  );
};

/**
 * Hook: 获取 Sentry 实例
 * @returns Sentry 实例
 */
export function useSentry(): typeof Sentry {
  return useContext(SentryContext);
}
