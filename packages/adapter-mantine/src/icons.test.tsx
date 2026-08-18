import {
  DELETE_ROW_ACTION_KEY,
  DUPLICATE_ROW_ACTION_KEY,
  PIN_BOTTOM_ACTION_KEY,
  PIN_TOP_ACTION_KEY,
  UNPIN_ROW_ACTION_KEY,
} from "@adapttable/core";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  AlertIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  CloseIcon,
  FiltersIcon,
  iconForRowAction,
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

  it("keeps a host icon and maps built-in keys to this kit's glyphs", () => {
    const host = <span data-testid="host" />;
    expect(iconForRowAction({ key: "edit", icon: host })).toBe(host);
    expect(iconForRowAction({ key: "edit" })).toBeUndefined();
    const keys = [
      DUPLICATE_ROW_ACTION_KEY,
      DELETE_ROW_ACTION_KEY,
      PIN_TOP_ACTION_KEY,
      PIN_BOTTOM_ACTION_KEY,
      UNPIN_ROW_ACTION_KEY,
    ];
    for (const key of keys) {
      const { container } = render(<>{iconForRowAction({ key })}</>);
      expect(container.querySelector("svg")).not.toBeNull();
    }
  });
});
