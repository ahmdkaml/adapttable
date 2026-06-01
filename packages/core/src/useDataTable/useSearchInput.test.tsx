import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useSearchInput } from "./useSearchInput";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("useSearchInput", () => {
  it("seeds from the committed search value", () => {
    const { result } = renderHook(() => useSearchInput("hello", vi.fn(), 300));
    expect(result.current.value).toBe("hello");
  });

  it("commits the trimmed value after the debounce", () => {
    const setSearch = vi.fn();
    const { result } = renderHook(() => useSearchInput("", setSearch, 300));
    act(() => result.current.setValue("  ali "));
    expect(setSearch).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(300));
    expect(setSearch).toHaveBeenCalledWith("ali");
  });

  it("does not re-commit a value already in sync", () => {
    const setSearch = vi.fn();
    renderHook(() => useSearchInput("ali", setSearch, 300));
    act(() => vi.advanceTimersByTime(300));
    expect(setSearch).not.toHaveBeenCalled();
  });

  it("mirrors an external committed change into the input", () => {
    const { result, rerender } = renderHook(
      ({ s }) => useSearchInput(s, vi.fn(), 300),
      { initialProps: { s: "a" } }
    );
    rerender({ s: "external" });
    expect(result.current.value).toBe("external");
  });
});
