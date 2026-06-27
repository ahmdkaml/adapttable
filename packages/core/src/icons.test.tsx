import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FiltersIcon, SearchIcon } from "./icons";

describe("chrome icons", () => {
  it("renders the funnel glyph", () => {
    const { container } = render(<FiltersIcon />);
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.querySelectorAll("path")).toHaveLength(1);
  });

  it("renders the magnifier glyph with a circle and a path", () => {
    const { container } = render(<SearchIcon />);
    expect(container.querySelector("circle")).not.toBeNull();
    expect(container.querySelectorAll("path")).toHaveLength(1);
  });
});
