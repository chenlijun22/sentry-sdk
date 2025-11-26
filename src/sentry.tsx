import React, { createContext, useContext } from "react";
import * as Sentry from "@sentry/react";
import type { SentryConfig } from "./types";


export { Sentry };

// Sentry Context
const SentryContext = createContext<typeof Sentry>(Sentry);


// Sentry integrations
export const SentryIntegrations: Sentry.BrowserOptions['integrations'] = [
  // 浏览器性能分析集成
  Sentry.browserProfilingIntegration(),
  // 浏览器会话集成
  Sentry.browserSessionIntegration(),
  // HTTP发生错误时上报请求头和cookie
  Sentry.httpClientIntegration(),
  // 浏览器追踪集成
  Sentry.browserTracingIntegration(),
  // http请求集成
  Sentry.httpClientIntegration(),
]

/**
 * 初始化 Sentry
 * @param config Sentry 配置
 */
export function initSentry(config: SentryConfig): void {
  const { replayCanvas, ignoreDev, ...options } = config;

  // 根据vite或webpack环境获取NODE_ENV
  const buildMode = (import.meta as any)?.env?.MODE || (typeof process !== 'undefined' && process.env?.NODE_ENV) || 'development';
  const isDevelopment = buildMode === 'development' || options.environment === 'development';

  // 如果配置了 ignoreDev 且是开发环境，则禁用 Sentry 上报
  // 但仍然初始化 Sentry，以便 setUser、captureException 等方法可以正常工作
  const shouldDisable = ignoreDev && isDevelopment;
  if (shouldDisable) {
    console.log('[Sentry] 开发环境已禁用 Sentry 上报 (ignoreDev: true)');
  }

  // https://docs.sentry.io/platforms/javascript/configuration/options
  Sentry.init({
    enabled: shouldDisable ? false : options.enabled,
    environment: options.environment || buildMode || 'development',
    beforeBreadcrumb(breadcrumb, hint) {
      if (options.beforeBreadcrumb) {
        options.beforeBreadcrumb(breadcrumb, hint);
      }
      // 1. 检查是否是 XHR/Fetch 产生的 'http' 类型面包屑
      if (
        breadcrumb.category === 'http' &&
        breadcrumb.data &&
        breadcrumb.data.url
      ) {
        const fullUrl = breadcrumb.data.url

        try {
          // 2. 使用 URL API 来解析 URL
          const urlObj = new URL(fullUrl)

          // 3. 构造只包含路径和主机名的 URL
          // 例如：https://api.example.com/users?id=123 -> https://api.example.com/users
          // 注意：只使用 pathname 可能会导致无法区分不同 host 的同 path 请求
          const safeUrl = urlObj.origin + urlObj.pathname

          // 4. 更新面包屑数据
          breadcrumb.data.url = safeUrl

          // 也可以选择更精简的格式，只保留 PathName
          // breadcrumb.message = `${breadcrumb.data.method || 'GET'} ${urlObj.pathname}`;
        } catch (e) {
          // 如果 URL 解析失败（例如，url 格式不规范），则跳过处理
          console.error('Failed to process breadcrumb URL:', e)
        }
      }

      // 5. 必须返回修改后的面包屑对象，或者返回 null 来完全丢弃它
      return breadcrumb
    },
    integrations: options.integrations || SentryIntegrations,
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
