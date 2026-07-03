import "./styles.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App";

// @adapttable/shadcn is the unstyled adapter pre-wired with the shadcn class
// preset; the shadcn design tokens it references live in styles.css.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
