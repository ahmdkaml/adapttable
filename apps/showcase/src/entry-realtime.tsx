import "./kitStyles";
import "./styles.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { PageShell } from "./PageShell";
import { RealtimeDemo } from "./RealtimeDemo";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PageShell active="realtime" root="..">
      {(dark) => <RealtimeDemo dark={dark} />}
    </PageShell>
  </StrictMode>
);
