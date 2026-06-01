import { MantineProvider } from "@mantine/core";
import { render, type RenderResult } from "@testing-library/react";
import type { ReactElement } from "react";

/** Render a component tree wrapped in a default `MantineProvider`. */
export function renderMantine(ui: ReactElement): RenderResult {
  return render(<MantineProvider>{ui}</MantineProvider>);
}
