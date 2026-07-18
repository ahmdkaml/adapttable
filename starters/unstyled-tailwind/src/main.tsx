import "./styles.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App";

// The unstyled adapter renders semantic HTML; Tailwind classes arrive through
// the `classNames` map in App.tsx (same pattern as the showcase Tailwind demo).
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
