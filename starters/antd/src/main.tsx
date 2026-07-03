import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App";

// Ant Design works without a provider (add antd's <ConfigProvider> only when you
// want theme or locale customization).
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
