/**
 * The Export button's click handler, and whether it is still working.
 *
 * The built-in browser export is synchronous: it builds a string and hands it
 * to the browser, and the button is never busy. A host-handled export
 * (`exportCsv.request`) is not — it may be a round trip or a queued job — so a
 * second click could start the same export again.
 *
 * This wraps either kind: the returned handler refuses a click while a promise
 * is still settling, and `busy` is what adapters render as a disabled,
 * `aria-busy` button. Every adapter goes through it, so the behaviour cannot
 * differ between kits.
 */
import { useCallback, useRef, useState } from "react";

import { devWarn } from "../utils/devWarn";

/** What {@link useExportHandler} returns. */
export interface ExportHandlerState {
  /** Bind to the Export button, or `undefined` when export is off. */
  onExportCsv: (() => void) | undefined;
  /** True while a host-handled export is still running. */
  exportBusy: boolean;
}

/**
 * Make an export handler single-flight and report when it is working.
 *
 * @param handler - The handler from `makeExportCsvHandler`, or `undefined`
 *   when the `exportCsv` prop is off.
 */
export function useExportHandler(
  handler: (() => void | Promise<void>) | undefined
): ExportHandlerState {
  const [exportBusy, setExportBusy] = useState(false);
  // A ref as well as state: the state renders the button, the ref is what the
  // click reads, so a second click cannot slip through before React re-renders.
  const inFlight = useRef(false);

  const onExportCsv = useCallback(() => {
    if (!handler || inFlight.current) return;
    const result = handler();
    if (!(result instanceof Promise)) return;
    inFlight.current = true;
    setExportBusy(true);
    const release = () => {
      inFlight.current = false;
      setExportBusy(false);
    };
    // Both outcomes release the button — a rejected export must not leave it
    // disabled for the rest of the session.
    //
    // The rejection is handled here rather than left to float, because an
    // unhandled rejection would surface in the host's error reporting as
    // something the table did. It is still the host's error, so development
    // says so out loud instead of swallowing it.
    void result.then(release, (error: unknown) => {
      release();
      devWarn(
        `exportCsv.request rejected, so no export happened. Handle the failure ` +
          `inside your request function — this warning is all the table can do ` +
          `with it. Reason: ${String(error)}`
      );
    });
  }, [handler]);

  // The button stays rendered while busy — disabled, not gone.
  return { onExportCsv: handler ? onExportCsv : undefined, exportBusy };
}
