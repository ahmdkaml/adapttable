import "@mantine/core/styles.css";
import "./tailwind.css";
import "./styles.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { PageShell, RtlSection } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PageShell active="rtl" root="..">
      {(dark) => <RtlSection dark={dark} />}
    </PageShell>
  </StrictMode>
);
