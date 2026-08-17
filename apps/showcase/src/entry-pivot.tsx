import "@mantine/core/styles.css";
import "./styles.css";

import { MantineProvider } from "@mantine/core";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { PageShell } from "./PageShell";
import { PivotDemo } from "./PivotDemo";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PageShell active="pivot" root="..">
      {(dark) => (
        <MantineProvider forceColorScheme={dark ? "dark" : "light"}>
          <PivotDemo dark={dark} />
        </MantineProvider>
      )}
    </PageShell>
  </StrictMode>
);
