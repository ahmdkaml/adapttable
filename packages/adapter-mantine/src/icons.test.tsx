import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  AlertIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  CloseIcon,
  FiltersIcon,
  InboxIcon,
  RefreshIcon,
  SearchIcon,
  SelectorIcon,
} from "./icons";

describe("icons", () => {
  it("renders every icon as an svg, including a custom size", () => {
    const icons = [
      <SearchIcon key="1" className="icon-cls" style={{ color: "red" }} />,
      <ChevronUpIcon key="2" />,
      <ChevronDownIcon key="3" />,
      <ChevronRightIcon key="3b" />,
      <SelectorIcon key="4" />,
      <CloseIcon key="5" />,
      <FiltersIcon key="6" />,
      <AlertIcon key="7" />,
      <RefreshIcon key="8" />,
      <InboxIcon key="9" size={40} />,
    ];
    const { container } = render(<div>{icons}</div>);
    expect(container.querySelectorAll("svg")).toHaveLength(icons.length);
  });
});
