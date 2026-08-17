import "./kitStyles";
import "./styles.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { AccessibilityDemo } from "./AccessibilityDemo";
import { PageShell } from "./PageShell";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PageShell active="accessibility" root="..">
      {(dark) => <AccessibilityDemo dark={dark} />}
    </PageShell>
  </StrictMode>
);
