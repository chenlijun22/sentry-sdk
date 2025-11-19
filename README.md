# channelwill-sentry-sdk

基于 Sentry React SDK 的轻量封装：默认集成了常用的 Sentry 插件，并提供 vite 和 webpack 二次封装的构建插件，方便在不同构建工具中上传 SourceMap 排查错误源码位置和 release 版本信息。

## 安装

```bash
npm install channelwill-sentry-sdk
```

## 快速开始

### 1. 初始化 Sentry

在应用入口文件（如 `main.tsx`）中初始化 Sentry：

```tsx
import { initSentry } from "channelwill-sentry-sdk";

// 初始化 Sentry
initSentry({
  dsn: import.meta.env.VITE_SENTRY_DSN, // 必填：Sentry 项目 DSN，用于标识错误上报的目标项目
});
```

### 2. 捕获 React 错误

使用 `SentryErrorBoundary` 包裹需要捕获错误的组件：

```tsx
// 直接代替：import { ErrorBoundary } from 'react-error-boundary'
import { SentryErrorBoundary } from "channelwill-sentry-sdk";

const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div
    role="alert"
    style={{ padding: 24, background: "#fffbe7", border: "1px solid #ffe58f" }}
  >
    <p style={{ fontWeight: 600, color: "#faad14" }}>出现了一个错误：</p>
    <pre style={{ color: "#ff4d4f" }}>{error.message}</pre>
    <button onClick={resetErrorBoundary} style={{ marginTop: 16 }}>
      重试
    </button>
  </div>
);

export function App() {
  return (
    <SentryErrorBoundary
      fallback={ErrorFallback}
      onReset={() => {
        /* 重置逻辑 */
      }}
    >
      <MainRoutes />
    </SentryErrorBoundary>
  );
}
```

`SentryErrorBoundary` 完全兼容 `react-error-boundary` 的 `ErrorBoundary` 的所有 Props（如 `fallback`、`fallbackRender`、`onReset`、`onError` 等），并在此基础上增加了自动上报到 Sentry 的能力。默认会把 `componentStack` 写入 Sentry Scope 并自动上报。

### 3. 上报用户信息

在用户登录后，使用 `Sentry.setUser()` 设置用户信息，这样在错误上报时可以关联到具体用户：

```tsx
import { Sentry } from "channelwill-sentry-sdk";

// 在项目中获取用户信息后设置sentry用户
async function getUserInfo() {
  const { data: user } = await getUserInfoAPI();
  Sentry.setUser({
    // id字段是内置必填，其他字段可自由拓展
    id: user.id, // 必填：用户唯一标识
    // 可拓展其他字段
    age: user.age,
    nikname: user.nickname,
  });
}

// 用户登出时清除用户信息
function handleLogout() {
  Sentry.setUser(null);
}
```

设置用户信息后，所有上报的错误都会自动关联到该用户，方便在 Sentry 后台追踪和定位问题。

## 构建工具上传 SourceMap （推荐）

上传 SourceMap 有助于排查错误代码位置，以及构建时记录的 `git commit id`作为`release` 版本标识，推荐加上这个功能

> 对于上传 SourceMap，可选安装 `@sentry/cli` 命令行上传 或在 CI 中设置 `SENTRY_AUTH_TOKEN`、`SENTRY_ORG`、`SENTRY_PROJECT` 环境变量。

### Vite

在 `vite.config.ts` 中配置 Sentry 插件，用于在生产构建时自动上传 SourceMap：

```ts
// vite.config.ts
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { sentryVitePlugin } from "channelwill-sentry-sdk/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      react(),
      // 生产环境启用 Sentry 插件上传 SourceMap
      // 从sentry文档此处获取相关配置：https://docs.sentry.io/platforms/javascript/guides/react/sourcemaps/uploading/vite/#configuration
      sentryVitePlugin({
        authToken: env.SENTRY_AUTH_TOKEN,
        org: env.SENTRY_ORG || "your-org",
        project: env.SENTRY_PROJECT || "your-project",
      }),
    ].filter(Boolean),
    build: {
      sourcemap: true, // 生成 sourcemap 用于调试
    },
  };
});
```

### Webpack

```js
// webpack.config.js
const { sentryWebpackPlugin } = require("channelwill-sentry-sdk/webpack");

module.exports = {
  // ...其他配置
  plugins: [
    // 从sentry文档此处获取相关配置：https://docs.sentry.io/platforms/javascript/guides/react/sourcemaps/uploading/webpack/#configuration
    sentryWebpackPlugin({
      authToken: process.env.SENTRY_AUTH_TOKEN,
      org: process.env.SENTRY_ORG || "your-org",
      project: process.env.SENTRY_PROJECT || "your-project",
    }),
  ],
};
```

### 环境变量配置

在 `.env` 文件中配置 Sentry 相关环境变量：

```bash
# .env
VITE_SENTRY_DSN=your-sentry-dsn
SENTRY_AUTH_TOKEN=your-auth-token
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
```

## 示例项目

仓库包含一个完整的示例项目：`examples/test-app`。运行方式：

```bash
cd examples/test-app
npm install
npm run dev
```

示例展示了：

- ✅ 在 `main.tsx` 中初始化 Sentry（包含 `replayCanvas` 配置）
- ✅ 使用 `SentryErrorBoundary` 捕获组件错误（包含 `beforeCapture` 回调）
- ✅ 直接使用 `Sentry` 对象手动上报错误和消息
- ✅ 在 `vite.config.ts` 中配置 Vite 插件上传 SourceMap
- ✅ 环境变量配置示例

查看 `examples/test-app/src/App.tsx` 了解完整用法。

## API

### 主入口 (`channelwill-sentry-sdk`)

| 导出                               | 说明                                                                                                                   |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `initSentry(config: SentryConfig)` | 初始化 Sentry（对 `@sentry/react` 的薄封装）。                                                                         |
| `SentryErrorBoundary`              | 基于 `react-error-boundary` 的二次封装，可直接代替 `ErrorBoundary` 使用，完全兼容所有 Props，并自动上报错误到 Sentry。 |
| `Sentry`                           | Sentry 对象，可直接使用 `Sentry.captureException()`、`Sentry.captureMessage()` 等方法。                                |

### 构建插件

| 导出路径                          | 说明                                                               |
| --------------------------------- | ------------------------------------------------------------------ |
| `channelwill-sentry-sdk/vite`    | `sentryVitePlugin(options)` - 创建 Vite SourceMap 上传插件。       |
| `channelwill-sentry-sdk/webpack` | `sentryWebpackPlugin(options)` - 创建 Webpack SourceMap 上传插件。 |
| `ensureSentryCliBinary()`         | 检查构建环境中是否可用 `sentry-cli`。                              |

### 类型定义

- `SentryConfig`: `initSentry` 的配置类型，继承自 `@sentry/react` 的配置选项。详细配置选项参考：[Sentry React 配置文档](https://docs.sentry.io/platforms/javascript/guides/react/configuration/options/)
- `SentryErrorBoundaryProps`: `SentryErrorBoundary` 的 Props 类型，完全兼容 `react-error-boundary` 的 `ErrorBoundaryProps`，并额外支持：
  - `beforeCapture?: (scope, error, errorInfo) => void` - 在错误捕获前自定义处理
  - `capture?: boolean` - 是否自动上报到 Sentry，默认为 `true`
- `FallbackProps`: 错误回退组件的 Props 类型，来自 `react-error-boundary`，包含 `error` 和 `resetErrorBoundary` 等属性
- `SentryVitePluginOptions`: Vite 插件的配置类型，详细配置选项参考：[Sentry Vite 插件文档](https://docs.sentry.io/platforms/javascript/guides/react/sourcemaps/uploading/vite/#configuration)
- `SentryWebpackPluginOptions`: Webpack 插件的配置类型，详细配置选项参考：[Sentry Webpack 插件文档](https://docs.sentry.io/platforms/javascript/guides/react/sourcemaps/uploading/webpack/#configuration)

所有类型定义都可以通过 TypeScript 自动导入和类型检查，IDE 会提供完整的类型提示。

## 开发

### 本地开发

```bash
# 安装依赖
npm install

# 构建 SDK
npm run build

# 启动 watch 模式，修改源码后自动重新构建
npm run dev

# 类型检查
npm run type-check
```

### 在示例项目调试

在开发 SDK 时，可以使用 `examples/test-app` 测试项目来调试本地更改：

1. **启动 SDK 的 watch 模式**（在项目根目录）：

   ```bash
   npm run dev
   ```

   这会监听源码变化并自动重新构建。

2. **在测试项目中安装本地 SDK**（在 `examples/test-app` 目录）：

   ```bash
   cd examples/test-app
   npm install
   ```

   测试项目的 `package.json` 中已配置使用本地包：`"channelwill-sentry-sdk": "file:../.."`

3. **启动测试项目**：

   ```bash
   npm run dev
   ```

   测试项目会自动使用本地构建的 SDK，修改 SDK 源码后会自动热更新。

4. **调试流程**：
   - 修改 SDK 源码（`src/` 目录下的文件）
   - SDK 的 watch 模式会自动重新构建
   - 测试项目会自动检测到变化并热更新
   - 在浏览器中测试功能，查看控制台和 Sentry 后台验证效果

> 💡 提示：测试项目需要配置 Sentry DSN 和环境变量。

## License

MIT
