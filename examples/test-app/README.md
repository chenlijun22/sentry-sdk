# Sentry SDK Test App

这是一个用于测试和调试本地 `@channelwill/sentry-sdk` 包的示例应用。

## 功能特性

- ✅ 测试 `SentryErrorBoundary` 错误捕获
- ✅ 测试 `useSentry` Hook 手动上报
- ✅ 测试 Sentry 初始化配置
- ✅ 测试 Vite 插件集成
- ✅ 支持热更新调试本地 SDK

## 快速开始

### 1. 安装依赖

确保已经构建了本地的 SDK 包：

```bash
# 在项目根目录
cd /Users/channelwill/works/sentry-sdk
npm install
npm run build
```

然后安装测试应用的依赖：

```bash
cd examples/test-app
npm install
```

### 2. 配置环境变量

项目支持通过 `.env` 文件自动加载环境变量。创建 `.env` 文件：

```bash
cd examples/test-app
cp .env.example .env  # 如果存在 .env.example
```

或者手动创建 `.env` 文件，添加以下配置：

```env
# Sentry 配置
# 客户端环境变量（需要 VITE_ 前缀才能在浏览器中访问）
VITE_SENTRY_DSN=https://your-dsn@sentry.io/your-project-id

# Sentry SourceMap 上传配置（仅在构建时使用，不需要 VITE_ 前缀）
SENTRY_AUTH_TOKEN=your-auth-token
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
SENTRY_RELEASE=1.0.0
```

**重要提示：**
- 客户端代码中使用的环境变量必须以 `VITE_` 前缀开头（如 `VITE_SENTRY_DSN`）
- 构建时使用的环境变量不需要前缀（如 `SENTRY_AUTH_TOKEN`）
- `.env` 文件已添加到 `.gitignore`，不会被提交到版本控制

如果你没有 Sentry 账号：
1. 访问 [sentry.io](https://sentry.io) 注册免费账号
2. 创建一个新项目
3. 复制项目的 DSN 和 Auth Token

### 3. 启动开发服务器

```bash
npm run dev
```

应用会在 `http://localhost:5173` 启动。

## 测试功能

### 1. ErrorBoundary 测试

点击 "触发组件错误" 按钮，会抛出一个 React 组件错误，ErrorBoundary 会：
- 捕获错误
- 显示错误回退 UI
- 自动上报错误到 Sentry

### 2. 手动上报测试

点击 "手动触发错误" 或 "发送消息到 Sentry" 按钮，会：
- 使用 `useSentry` Hook 获取 Sentry 实例
- 手动调用 `captureException` 或 `captureMessage`
- 附加自定义标签和上下文

### 3. 查看上报结果

- 打开浏览器控制台查看 Sentry 事件详情
- 登录 Sentry 后台查看接收到的错误和消息

## 调试本地 SDK

由于使用了 `"@channelwill/sentry-sdk": "file:../.."` 的方式引用本地包：

1. 修改 SDK 源码后，运行 `npm run build` 重新构建
2. 测试应用会自动使用最新的构建结果
3. 如果使用 `npm run dev`（在 SDK 根目录），可以实现实时监听和构建

## 测试 SourceMap 上传

要测试 SourceMap 上传功能：

1. 在 `.env` 文件中配置 Sentry 相关环境变量（见上方配置说明）

2. 构建生产版本：

```bash
NODE_ENV=production npm run build
```

3. 查看 Sentry 后台的 Source Maps 页面，确认上传成功

**注意：** 环境变量会自动从 `.env` 文件加载，无需手动 export

## 项目结构

```
test-app/
├── src/
│   ├── App.tsx          # 主应用组件，包含测试功能
│   ├── App.css          # 样式文件
│   ├── main.tsx         # 入口文件，初始化 Sentry
│   └── index.css        # 全局样式
├── index.html           # HTML 模板
├── vite.config.ts       # Vite 配置（自动加载 .env 文件）
├── tsconfig.json        # TypeScript 配置
├── package.json         # 依赖配置
└── .env                 # 环境变量配置（需要手动创建，已加入 .gitignore）
```

## 常见问题

### Q: 为什么看不到 Sentry 事件？

A: 
1. 确认 DSN 配置正确
2. 检查浏览器控制台是否有错误
3. 开发环境可能会被 Sentry 过滤，尝试改为 production 环境

### Q: 修改 SDK 后没有生效？

A:
1. 确保在 SDK 根目录运行了 `npm run build`
2. 尝试删除 `node_modules/.vite` 缓存
3. 重启开发服务器

### Q: 如何测试不同的配置？

A:
修改 `src/main.tsx` 中的 `initSentry` 配置即可。

## License

MIT

