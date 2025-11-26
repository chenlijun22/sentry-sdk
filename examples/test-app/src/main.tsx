import React from "react";
import ReactDOM from "react-dom/client";
import { initSentry } from "channelwill-sentry-sdk";
import App from "./App";
import "./index.css";

// 初始化 Sentry
initSentry({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE || "development",
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
