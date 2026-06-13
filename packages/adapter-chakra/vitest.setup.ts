import "@testing-library/jest-dom/vitest";

import { expect } from "vitest";
import * as axeMatchers from "vitest-axe/matchers";

expect.extend(axeMatchers);

if (typeof globalThis.matchMedia !== "function") {
  globalThis.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  });
}

// Chakra v3 overlays (Popover / Drawer) position via Ark's zag + floating-ui,
// which observe element size to keep the floating card anchored. jsdom ships
// neither observer, so polyfill them with inert stubs — the tests assert DOM
// presence and behaviour, not pixel placement.
const noop = (): undefined => undefined;

if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe(): void {
      noop();
    }
    unobserve(): void {
      noop();
    }
    disconnect(): void {
      noop();
    }
  };
}

if (typeof globalThis.IntersectionObserver === "undefined") {
  globalThis.IntersectionObserver = class {
    readonly root = null;
    readonly rootMargin = "";
    readonly thresholds = [];
    observe(): void {
      noop();
    }
    unobserve(): void {
      noop();
    }
    disconnect(): void {
      noop();
    }
    takeRecords(): [] {
      return [];
    }
  };
}

if (typeof Element.prototype.scrollTo !== "function") {
  Element.prototype.scrollTo = noop;
}
