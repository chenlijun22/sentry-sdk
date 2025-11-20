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
  const { replayCanvas, ...options } = config;

  // 根据vite或webpack环境获取NODE_ENV
  const buildMode = (import.meta as any)?.env?.MODE || (typeof process !== 'undefined' && process.env?.NODE_ENV) || 'development';

  // https://docs.sentry.io/platforms/javascript/configuration/options
  Sentry.init({
    environment: options.environment || buildMode || 'development',
    integrations: [
      // 浏览器性能分析集成
      Sentry.browserProfilingIntegration(),
      // 浏览器会话集成
      Sentry.browserSessionIntegration(),
      // HTTP发生错误时上报请求头和cookie
      Sentry.httpClientIntegration(),
      // 浏览器追踪集成
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
