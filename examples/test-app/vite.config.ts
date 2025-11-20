import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { sentryVitePlugin } from "channelwill-sentry-sdk/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量，Vite 会自动读取 .env 文件
  // loadEnv 会加载 .env, .env.local, .env.[mode], .env.[mode].local
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      react(),
      // 生产环境启用 Sentry 插件上传 SourceMap
      // process.env.NODE_ENV === "production" &&
      //   sentryVitePlugin({
      //     authToken: env.SENTRY_AUTH_TOKEN,
      //     org: env.SENTRY_ORG || "ddd-ul",
      //     project: env.SENTRY_PROJECT || "sentry-sdk-project",
      //     releaseName: env.SENTRY_RELEASE,
      //   }),
    ].filter(Boolean),
    build: {
      sourcemap: true, // 生成 sourcemap 用于调试
    },
  };
});
