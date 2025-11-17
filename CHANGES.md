# 配置变更说明

## 📝 变更日期
$(date '+%Y-%m-%d %H:%M:%S')

## 🎯 变更目标
测试项目使用完整包名 `channelwill-sentry-sdk` 而不是子路径 `/runtime`

## ✅ 已完成的变更

### 1. 测试项目导入更新

#### examples/test-app/src/main.tsx
```typescript
// 之前
import { initSentry, SentryProvider } from 'channelwill-sentry-sdk/runtime';

// 现在
import { initSentry, SentryProvider } from 'channelwill-sentry-sdk';
```

#### examples/test-app/src/App.tsx
```typescript
// 之前
import { SentryErrorBoundary, useSentry } from 'channelwill-sentry-sdk/runtime';

// 现在
import { SentryErrorBoundary, useSentry } from 'channelwill-sentry-sdk';
```

#### examples/test-app/vite.config.ts
```typescript
// 之前（注释状态）
// import { createSentryVitePlugin } from 'channelwill-sentry-sdk';

// 现在（启用）
import { createSentryVitePlugin } from 'channelwill-sentry-sdk';

export default defineConfig({
  plugins: [
    react(),
    process.env.NODE_ENV === 'production' &&
      createSentryVitePlugin({
        releaseName: process.env.RELEASE || '1.0.0',
        sourcemaps: {
          assets: './dist/assets/**',
        },
      }),
  ].filter(Boolean),
});
```

### 2. 文档更新

#### README.md
- ✅ 更新示例项目说明
- ✅ 添加实时开发模式指南
- ✅ 说明测试应用使用完整包名
- ✅ 引用新的 DEV_GUIDE.md

#### DEV_GUIDE.md (新增)
- ✅ 完整的开发流程说明
- ✅ 包结构和导出说明
- ✅ 实时开发验证步骤
- ✅ 常见问题解答

## 🏗️ 技术细节

### 包结构
```
channelwill-sentry-sdk/
├── dist/index.js          # 主入口（包含所有功能）
│   ├── 运行时功能
│   └── 构建插件
└── dist/runtime.js        # 运行时入口（仅运行时功能）
```

### 导出内容

主入口导出：
- `initSentry`, `SentryProvider`, `useSentry`
- `SentryErrorBoundary`
- `createSentryVitePlugin`, `createSentryWebpackPlugin`
- `ensureSentryCliBinary`
- 所有类型定义

### 开发模式

```bash
# npm run dev 构建两个入口：
# 1. src/index.ts → dist/index.js (主入口)
# 2. src/runtime.ts → dist/runtime.js (运行时入口)
```

测试应用通过 `file:../..` 引用本地包，直接使用 `dist/` 目录：
- 实时构建 → 自动更新 → 浏览器热更新

## 🎉 优势

1. **真实环境测试**：测试应用使用的导入方式与实际用户一致
2. **完整功能测试**：可以测试运行时功能和构建插件
3. **实时开发**：修改源码后立即生效，无需手动构建
4. **tree-shaking**：浏览器环境下，构建插件会被自动移除

## 🚀 使用方法

### 开发模式
```bash
# 终端 1
npm run dev

# 终端 2
cd examples/test-app
npm run dev
```

### 测试构建插件
```bash
cd examples/test-app
NODE_ENV=production npm run build
```

## 📋 验证清单

- [x] 主包构建成功
- [x] 测试应用导入路径更新
- [x] Vite 配置插件启用
- [x] 导入功能验证通过
- [x] 文档更新完成

## 🔍 验证命令

```bash
# 验证包构建
npm run build && ls -la dist/

# 验证导入
cd examples/test-app
node -e "import('channelwill-sentry-sdk').then(m => console.log('✅', Object.keys(m)))"

# 验证插件
node -e "import('channelwill-sentry-sdk').then(m => console.log('✅ Plugin:', typeof m.createSentryVitePlugin))"
```

## 📚 相关文档

- DEV_GUIDE.md - 完整开发指南
- README.md - 项目说明
- package.json - 包配置
- rollup.config.js - 构建配置
