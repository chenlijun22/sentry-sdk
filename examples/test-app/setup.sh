#!/bin/bash

# Sentry SDK Test App 快速启动脚本

set -e

echo "🚀 开始设置 Sentry SDK Test App..."
echo ""

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误：请在 examples/test-app 目录下运行此脚本"
    exit 1
fi

# 检查是否已构建主包
echo "📦 检查主包构建状态..."
if [ ! -d "../../dist" ]; then
    echo "⚠️  主包尚未构建，正在构建..."
    cd ../..
    npm install
    npm run build
    cd examples/test-app
    echo "✅ 主包构建完成"
else
    echo "✅ 主包已构建"
fi

echo ""
echo "📥 安装测试应用依赖..."
npm install

echo ""
echo "✅ 设置完成！"
echo ""
echo "📝 下一步："
echo "   1. 编辑 src/main.tsx，配置你的 Sentry DSN"
echo "   2. 运行 'npm run dev' 启动开发服务器"
echo "   3. 访问 http://localhost:5173"
echo ""
echo "💡 提示：修改 SDK 源码后，在根目录运行 'npm run build' 重新构建"

