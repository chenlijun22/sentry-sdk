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

// 敏感接口请求测试组件
function SensitiveApiButton() {
  const [loading, setLoading] = useState(false);

  const handleSensitiveRequest = async () => {
    setLoading(true);
    try {
      // 模拟敏感接口请求，包含敏感信息
      const sensitiveData = {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-token',
        password: 'secret123456',
        apiKey: 'sk-1234567890abcdef',
        creditCard: '4111-1111-1111-1111',
        ssn: '123-45-6789',
      };

      // 发起请求（这个接口不存在，会失败）
      const response = await fetch('https://api.ppp.com/api/secret/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sensitiveData.token}`,
        },
        body: JSON.stringify({
          username: 'testuser',
          password: sensitiveData.password,
          paymentInfo: {
            cardNumber: sensitiveData.creditCard,
            ssn: sensitiveData.ssn,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`敏感接口请求失败: ${response.status} ${response.statusText}`);
      }

      await response.json();
      alert('敏感接口请求成功（测试用）');
    } catch (error: any) {
      // 捕获错误并上报到 Sentry
      Sentry.captureException(error, {
        tags: {
          component: 'SensitiveApiButton',
          requestType: 'sensitive-api',
        },
        extra: {
          timestamp: new Date().toISOString(),
          endpoint: 'https://api.example.com/sensitive/endpoint',
        },
        contexts: {
          request: {
            url: 'https://api.example.com/sensitive/endpoint',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer [REDACTED]',
            },
          },
        },
      });
      alert(`敏感接口请求失败，错误已上报到 Sentry: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="button-group">
      <button
        onClick={handleSensitiveRequest}
        className="btn-sensitive"
        disabled={loading}
      >
        {loading ? '请求中...' : '发起敏感接口请求'}
      </button>
      <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
        ⚠️ 此请求包含敏感信息（token、密码、信用卡号等），用于测试 Sentry 的数据脱敏功能
      </p>
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
          <h2>3. 测试敏感接口请求</h2>
          <p>发起包含敏感信息的接口请求，测试 Sentry 的数据脱敏和错误捕获功能</p>
          <SensitiveApiButton />
        </section>

        <section className="section">
          <h2>4. 调试说明</h2>
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

