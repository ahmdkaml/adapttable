import "@mantine/core/styles.css";
import "./tailwind.css";
import "./styles.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { CustomizeSections, PageShell } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PageShell active="customize" root="..">
      {() => <CustomizeSections />}
    </PageShell>
  </StrictMode>
);
