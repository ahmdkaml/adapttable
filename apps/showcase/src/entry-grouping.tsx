import "@mantine/core/styles.css";
import "./styles.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { GroupingDemo } from "./GroupingDemo";
import { PageShell } from "./PageShell";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PageShell active="grouping" root="..">
      {(dark) => <GroupingDemo dark={dark} />}
    </PageShell>
  </StrictMode>
);
