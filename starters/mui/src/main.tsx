import { createTheme, ThemeProvider } from "@mui/material";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App";

// MUI works with the default theme out of the box; the ThemeProvider is here so
// you have a place to customize it.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider theme={createTheme()}>
      <App />
    </ThemeProvider>
  </StrictMode>
);
