import "@radix-ui/themes/styles.css";

import { Theme } from "@radix-ui/themes";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App";

// Radix Themes needs its stylesheet (imported above) and a <Theme> wrapper.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Theme>
      <App />
    </Theme>
  </StrictMode>
);
