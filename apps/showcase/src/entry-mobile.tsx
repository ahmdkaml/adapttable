import "./kitStyles";
import "./styles.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { MobileDemo } from "./MobileDemo";
import { PageShell } from "./PageShell";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PageShell active="mobile" root="..">
      {(dark) => <MobileDemo dark={dark} />}
    </PageShell>
  </StrictMode>
);
