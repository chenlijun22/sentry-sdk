import { useEffect, useState } from 'react';
import { Sentry, SentryErrorBoundary } from 'channelwill-sentry-sdk';
import './App.css';

// 错误回退组件
function ErrorFallback({ error, resetErrorBoundary }: any) {
  return (
    <div role="alert" className="error-fallback">
      <h2>😨 出错了！</h2>
      <pre style={{ color: 'red' }}>{error.message}</pre>
      <button onClick={resetErrorBoundary}>重试</button>
    </div>
  );
}

// 会抛出错误的组件
function BuggyComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('这是一个测试错误，由 BuggyComponent 抛出');
  }
  return <div>✅ 组件正常运行</div>;
}

// 手动触发错误的组件
function ManualErrorButton() {

  const handleManualError = () => {
    try {
      throw new Error('这是一个手动捕获的错误');
    } catch (error) {
      Sentry.captureException(error, {
        tags: { component: 'ManualErrorButton' },
        extra: { timestamp: new Date().toISOString() },
      });
      alert('已手动上报错误到 Sentry');
    }
  };

  const handleManualMessage = () => {
    Sentry.captureMessage('这是一条测试消息', {
      level: 'info',
      tags: { action: 'test' },
    });
    alert('已发送消息到 Sentry');
  };

  return (
    <div className="button-group">
      <button onClick={handleManualError} className="btn-manual">
        手动触发错误
      </button>
      <button onClick={handleManualMessage} className="btn-message">
        发送消息到 Sentry
      </button>
    </div>
  );
}

function App() {
  const [shouldThrow, setShouldThrow] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const resetError = () => {
    setShouldThrow(false);
    setResetKey((prev) => prev + 1);
  };

  useEffect(() => {
    Sentry.setUser({
      id: '1234567890',
      email: 'test@example.com',
      username: 'test',
      
    });
  }, []);

  return (
    <div className="app">
      <header className="header">
        <h1>🚀 Sentry SDK Test App</h1>
        <p>用于测试和调试本地 Sentry SDK 包</p>
      </header>

      <main className="main">
        <section className="section">
          <h2>1. 测试 ErrorBoundary</h2>
          <p>点击按钮触发组件错误，ErrorBoundary 将捕获并上报到 Sentry</p>
          <SentryErrorBoundary
            key={resetKey}
            FallbackComponent={ErrorFallback}
            onReset={resetError}
            beforeCapture={(scope) => {
              scope.setTag('error-boundary', 'app-test');
              scope.setContext('test-info', {
                timestamp: new Date().toISOString(),
                location: 'App Component',
              });
            }}
          >
            <div className="test-area">
              <BuggyComponent shouldThrow={shouldThrow} />
              {!shouldThrow && (
                <button
                  onClick={() => setShouldThrow(true)}
                  className="btn-throw"
                >
                  触发组件错误
                </button>
              )}
            </div>
          </SentryErrorBoundary>
        </section>

        <section className="section">
          <h2>2. 测试 useSentry Hook</h2>
          <p>使用 useSentry 获取 Sentry 实例，手动上报错误和消息</p>
          <ManualErrorButton />
        </section>

        <section className="section">
          <h2>3. 调试说明</h2>
          <ul className="instructions">
            <li>
              ✅ 请先在 <code>src/main.tsx</code> 中配置你的 Sentry DSN
            </li>
            <li>✅ 打开浏览器控制台查看 Sentry 事件详情</li>
            <li>✅ 修改本地 SDK 代码后，会自动热更新</li>
            <li>
              ✅ 如需测试 SourceMap 上传，请配置{' '}
              <code>vite.config.ts</code>
            </li>
          </ul>
        </section>
      </main>

      <footer className="footer">
        <p>
          📦 使用本地包: <code>channelwill-sentry-sdk</code>
        </p>
      </footer>
    </div>
  );
}

export default App;

