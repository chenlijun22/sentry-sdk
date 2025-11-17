# Sentry SDK Examples

这个目录包含了 `channelwill-sentry-sdk` 的示例项目。

## 示例列表

### test-app

一个完整的 React + Vite 测试应用，用于调试和测试本地 SDK 包。

**特性：**
- ✅ 测试 ErrorBoundary 错误捕获
- ✅ 测试 useSentry Hook 手动上报
- ✅ 测试 Sentry 初始化配置
- ✅ 测试 Vite 插件集成
- ✅ 支持热更新调试

**快速开始：**

```bash
cd test-app
chmod +x setup.sh
./setup.sh
npm run dev
```

详见：[test-app/README.md](./test-app/README.md)

## 使用说明

所有示例项目都使用 `"file:../.."` 的方式引用本地 SDK 包，这样可以：

1. 实时测试本地修改
2. 无需发布即可调试
3. 简化开发流程

如果修改了 SDK 源码，请在根目录运行：

```bash
npm run build
```

或者使用监听模式：

```bash
npm run dev
```

## 添加新示例

如果你想添加新的示例项目：

1. 在此目录下创建新文件夹
2. 在 `package.json` 中添加依赖：`"channelwill-sentry-sdk": "file:../.."`
3. 添加相应的 README.md 说明文档
4. 更新此文件，添加新示例的说明

