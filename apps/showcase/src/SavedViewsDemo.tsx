import type { SavedView } from "@adapttable/core";
import { useSavedViews } from "@adapttable/core";
import { getLabels } from "@adapttable/i18n";
import { Suspense, useMemo, useState } from "react";

import { cssVars } from "./cssVars";
import { BASE_COLUMNS, PEOPLE, type Person } from "./data";
import { KitSwitcher, readKitFromUrl } from "./kitDemos";
import { KitProvider, kitSavedViewsPanel, kitTable } from "./kitProviders";
import { SectionHead } from "./sections";
import { ADAPTER_TOKENS } from "./themeTokens";

/**
 * A view this reader did not create, to show what a shared one looks like.
 * Its controls are disabled and it says why — the case a demo usually skips
 * and the one that matters most.
 */
const SHARED: SavedView = {
  name: "Team: engineering",
  search: "sv.q=eng",
  visibility: "team",
  readOnly: true,
  version: 2,
};

/** Views saved by an older table, so the migration path is on screen too. */
const SEED = JSON.stringify([
  SHARED,
  { name: "Legacy view", search: "sv.q=a" },
]);

/** In-memory storage seeded for the demo, so a visitor sees a populated list. */
function useDemoStorage() {
  return useMemo(() => {
    const store = new Map<string, string>([["showcase-views", SEED]]);
    return {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    };
  }, []);
}

/**
 * The saved-views page: a table, the views menu, and the management panel — in
 * whichever kit the reader picks, because a management panel is as much a kit's
 * own component as the table beside it. Only view controls: the point of the
 * page is what a view is worth, not the rest of the table.
 */
export function SavedViewsDemo({ dark }: Readonly<{ dark: boolean }>) {
  const [adapter, setAdapter] = useState(readKitFromUrl);
  const token =
    ADAPTER_TOKENS.find((candidate) => candidate.key === adapter) ??
    ADAPTER_TOKENS[0];
  const storage = useDemoStorage();
  const [migrated, setMigrated] = useState<string[]>([]);
  const views = useSavedViews({
    storageKey: "showcase-views",
    storage,
    urlKey: "sv",
    migrate: (view, from) => {
      setMigrated((seen) =>
        seen.includes(view.name) ? seen : [...seen, `${view.name} (v${from})`]
      );
      return view;
    },
  });
  const SavedViewsPanel = kitSavedViewsPanel(adapter);
  const Table = kitTable<Person>(adapter);

  return (
    <section className="sec shell" id="saved-views">
      <SectionHead title="Save the table you built. Send someone the link.">
        A view captures everything the table can put in a URL — search, sort,
        filters, grouping, the column layout, density and the pivot — under a
        name. Rename them in place, reorder with buttons, choose the one the
        table opens with. A shared view someone else owns arrives read-only and
        says so.
      </SectionHead>
      <KitSwitcher adapter={adapter} dark={dark} onChange={setAdapter} />
      <div className="pad-surface">
        <KitProvider kit={adapter} dark={dark}>
          <div
            className="pivot-layout"
            style={cssVars({
              "--c": dark ? token.accentDark : token.accentLight,
            })}
            data-adapter={adapter}
            key={adapter}
          >
            <div>
              <Suspense fallback={null}>
                <SavedViewsPanel
                  views={views.views}
                  onApply={views.apply}
                  onRename={views.rename}
                  onMove={views.move}
                  onSetDefault={views.setDefault}
                  onRemove={views.remove}
                  labels={getLabels("en")}
                />
              </Suspense>
              {migrated.length > 0 && (
                <p className="hint" data-testid="migrated">
                  Upgraded on load: {migrated.join(", ")}
                </p>
              )}
            </div>
            <div>
              <Suspense fallback={null}>
                <Table
                  data={PEOPLE}
                  columns={BASE_COLUMNS}
                  rowKey={(row) => row.id}
                  urlKey="sv"
                  savedViews={{ storageKey: "showcase-views", storage }}
                  labels={getLabels("en")}
                />
              </Suspense>
            </div>
          </div>
        </KitProvider>
      </div>
    </section>
  );
}
