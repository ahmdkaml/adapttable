import { getLabels } from "@adapttable/i18n";
import { FilterDrawer } from "@adapttable/mantine";
import { MantineProvider } from "@mantine/core";
import { startTransition, Suspense, useId, useState } from "react";

import { cssVars } from "./cssVars";
import type { Locale } from "./data";
import {
  AdvancedFiltersProvider,
  type DataMode,
  type Density,
  type FiltersUi,
} from "./Demo";
import { DemoFilterSetProvider } from "./demoFilters";
import {
  ADAPTERS,
  Control,
  ControlPanel,
  DemoFallback,
  KitSwitcher,
  readKitFromUrl,
  Segmented,
} from "./kitDemos";
import { SectionHead } from "./sections";
import { ADAPTER_TOKENS } from "./themeTokens";

type OnOff = "on" | "off";
type Structure = "flat" | "grouped" | "tree" | "nested";
type EditingMode = "off" | "cell" | "row" | "batch";
type Recipe = "baseline" | "filters" | "structure" | "editing" | "rows";

const FEATURE_LAB_DRAWER_LABELS = {
  ...getLabels("en"),
  filters: "Configure Feature Lab",
  clearAll: "Reset",
  filtersDone: "Done",
  cancel: "Close options",
};

const RECIPES: readonly {
  key: Recipe;
  label: string;
  description: string;
}[] = [
  {
    key: "baseline",
    label: "Baseline",
    description: "Plain frontend table with the full toolbar.",
  },
  {
    key: "filters",
    label: "Filters",
    description: "Checklist, operators, facets, and the AND/OR builder.",
  },
  {
    key: "structure",
    label: "Structure",
    description: "Nested row groups and collapsible column groups.",
  },
  {
    key: "editing",
    label: "Editing",
    description: "Cell editor, selection, fill, undo, and conflicts.",
  },
  {
    key: "rows",
    label: "Rows",
    description: "Add, delete, reorder, pin, span, and decorate rows.",
  },
];

/**
 * The Lab's own panels.
 *
 * `sidePanel` takes content, not a feature flag — the table docks whatever
 * the host puts in it. These two show that: a note, and the same guidance
 * the Lab prints elsewhere, rendered inside the panel instead of above it.
 */
const SIDE_PANELS = [
  {
    key: "about",
    label: "About",
    content: (
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>
        A docked panel keeps the rows visible while you change them. Its
        contents are yours — a column list, a filter form, a pivot builder.
      </p>
    ),
  },
  {
    key: "keys",
    label: "Keyboard",
    content: (
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>
        Arrow keys move between tabs and wrap at the ends, Home and End jump to
        them, and Escape closes the panel from anywhere inside it.
      </p>
    ),
  },
];

function Toggle({
  label,
  value,
  disabledOn,
  onChange,
}: Readonly<{
  label: string;
  value: OnOff;
  disabledOn?: string;
  onChange: (value: OnOff) => void;
}>) {
  return (
    <Control label={label}>
      <Segmented
        label={label.toLowerCase()}
        value={value}
        onChange={onChange}
        options={[
          { value: "off", label: "Off" },
          {
            value: "on",
            label: "On",
            disabled: Boolean(disabledOn),
            title: disabledOn,
          },
        ]}
      />
    </Control>
  );
}

export function AllOptionsDemo({ dark }: Readonly<{ dark: boolean }>) {
  const [adapter, setAdapter] = useState(readKitFromUrl);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [recipe, setRecipe] = useState<Recipe | null>("baseline");
  const [filterSet, setFilterSet] = useState<"live" | "kitchen">("live");
  const [advancedFilters, setAdvancedFilters] = useState(false);
  const [mode, setMode] = useState<DataMode>("frontend");
  const [locale, setLocale] = useState<Locale>("en");
  const [density, setDensity] = useState<Density>("comfortable");
  const [filtersUi, setFiltersUi] = useState<FiltersUi>("popover");
  const [motion, setMotion] = useState<OnOff>("on");
  const [structure, setStructure] = useState<Structure>("flat");
  const [columnGroups, setColumnGroups] = useState<OnOff>("off");
  const [sparkline, setSparkline] = useState<OnOff>("off");
  const [editorShowcase, setEditorShowcase] = useState<OnOff>("off");
  const [statusBar, setStatusBar] = useState<OnOff>("off");
  const [undoRedo, setUndoRedo] = useState<OnOff>("off");
  const [settingsPanel, setSettingsPanel] = useState<OnOff>("off");
  const [openPanel, setOpenPanel] = useState<string | null>("about");
  const [editingMode, setEditingMode] = useState<EditingMode>("off");
  const [rowMutations, setRowMutations] = useState<OnOff>("off");
  const [rowReorder, setRowReorder] = useState<OnOff>("off");
  const [rowPinning, setRowPinning] = useState<OnOff>("off");
  const [cellSpan, setCellSpan] = useState<OnOff>("off");
  const [extraRows, setExtraRows] = useState<OnOff>("off");
  const [rowStyle, setRowStyle] = useState<OnOff>("off");

  const token =
    ADAPTER_TOKENS.find((candidate) => candidate.key === adapter) ??
    ADAPTER_TOKENS[0];
  const accent = dark ? token.accentDark : token.accentLight;
  const Demo = ADAPTERS[adapter] ?? ADAPTERS.mantine;
  const clientOnlyReason =
    mode === "backend"
      ? "This control needs the complete frontend row set."
      : undefined;
  const structured = structure === "grouped" || structure === "tree";
  const reorderReason =
    clientOnlyReason ??
    (structured
      ? "Row reorder is unavailable while grouped or tree rows are active."
      : undefined);
  const pinReason =
    clientOnlyReason ??
    (structured
      ? "Row pinning is unavailable while grouped or tree rows are active."
      : undefined);
  const enabledRowFeatures = [
    rowMutations,
    rowReorder,
    rowPinning,
    cellSpan,
    extraRows,
    rowStyle,
  ].filter((value) => value === "on").length;
  const optionsHeadingId = useId();
  let interactionSummary = "read only";
  if (editingMode !== "off") {
    interactionSummary = `${editingMode} editing`;
  } else if (enabledRowFeatures > 0) {
    interactionSummary = `${enabledRowFeatures} row features`;
  }
  const configSummary = `${
    RECIPES.find((item) => item.key === recipe)?.label ?? "Custom"
  }: ${mode}, ${filtersUi} filters, ${structure} rows, ${interactionSummary}`;
  let compatibilityNote = null;
  if (clientOnlyReason) {
    compatibilityNote = (
      <small>
        Backend mode keeps server query, filters, paging, and column state
        active. Client-only row features are disabled.
      </small>
    );
  } else if (structured) {
    compatibilityNote = (
      <small>
        Reorder and pin are disabled because grouped/tree rows do not have one
        stable flat row index.
      </small>
    );
  }

  const resetRows = () => {
    setRowMutations("off");
    setRowReorder("off");
    setRowPinning("off");
    setCellSpan("off");
    setExtraRows("off");
    setRowStyle("off");
  };

  const customize = <T,>(setter: (value: T) => void, value: T) => {
    startTransition(() => {
      setRecipe(null);
      setter(value);
    });
  };

  const applyRecipe = (next: Recipe) => {
    startTransition(() => {
      setRecipe(next);
      setMode("frontend");
      setFilterSet(next === "filters" ? "kitchen" : "live");
      setAdvancedFilters(next === "filters");
      setFiltersUi("popover");
      setDensity("comfortable");
      setMotion("on");
      setStructure(next === "structure" ? "grouped" : "flat");
      setColumnGroups(next === "structure" ? "on" : "off");
      setSparkline("off");
      setEditorShowcase("off");
      setEditingMode(next === "editing" ? "cell" : "off");
      resetRows();
      if (next === "rows") {
        setRowMutations("on");
        setRowReorder("on");
        setRowPinning("on");
        setCellSpan("on");
        setExtraRows("on");
        setRowStyle("on");
      }
    });
  };

  const resetOptions = () => {
    applyRecipe("baseline");
    setLocale("en");
  };

  const changeMode = (next: DataMode) => {
    startTransition(() => {
      setRecipe(null);
      setMode(next);
      if (next === "backend") {
        setStructure("flat");
        setEditingMode("off");
        resetRows();
      }
    });
  };

  const changeStructure = (next: Structure) => {
    startTransition(() => {
      setRecipe(null);
      setStructure(next);
      if (next === "grouped" || next === "tree") {
        setRowReorder("off");
        setRowPinning("off");
      }
    });
  };

  return (
    <section className="sec shell" id="demo">
      <SectionHead title="Feature Lab. Build a valid table configuration.">
        Start from a working recipe, switch kits, then tune the exact props.
        Incompatible controls explain why they are unavailable instead of
        appearing to work while the table silently ignores them.
      </SectionHead>

      <div className="lab-recipes" role="group" aria-label="Feature recipes">
        {RECIPES.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`lab-recipe${recipe === item.key ? " is-on" : ""}`}
            aria-pressed={recipe === item.key}
            onClick={() => applyRecipe(item.key)}
          >
            <strong>{item.label}</strong>
            <span>{item.description}</span>
          </button>
        ))}
      </div>

      <KitSwitcher adapter={adapter} dark={dark} onChange={setAdapter} />

      <div
        className="lab-toolbar"
        role="group"
        aria-labelledby={optionsHeadingId}
      >
        <div>
          <strong id={optionsHeadingId}>Table options</strong>
          <span>Configure data, filters, structure, editing, and rows.</span>
        </div>
        <button
          type="button"
          className="lab-config-trigger"
          aria-haspopup="dialog"
          aria-expanded={controlsOpen}
          onClick={() => setControlsOpen(true)}
        >
          Configure options
        </button>
      </div>

      <div className="lab-layout">
        <MantineProvider forceColorScheme={dark ? "dark" : "light"}>
          <FilterDrawer
            opened={controlsOpen}
            onClose={() => setControlsOpen(false)}
            filters={
              <>
                <p className="lab-options-drawer__intro">
                  Only compatible combinations can be enabled.
                </p>
                {/* The configuration summary is a live region, and a live
                    region the reader has been moved away from announces
                    nothing useful — so while the drawer holds focus it lives
                    in here, beside the controls that change it. */}
                <div className="visually-hidden" role="status">
                  {configSummary}
                </div>
                <aside
                  className="opt-board lab-options-drawer__controls"
                  aria-label="Feature Lab controls"
                >
                  <ControlPanel title="Data and chrome">
                    <Control label="Data">
                      <Segmented
                        label="data source"
                        value={mode}
                        onChange={changeMode}
                        options={[
                          { value: "frontend", label: "Frontend" },
                          { value: "backend", label: "Backend" },
                        ]}
                      />
                    </Control>
                    <Control label="Locale">
                      <Segmented
                        label="locale"
                        value={locale}
                        onChange={(next) => customize(setLocale, next)}
                        options={[
                          { value: "en", label: "EN" },
                          { value: "ar", label: "العربية" },
                        ]}
                      />
                    </Control>
                    <Control label="Filter UI">
                      <Segmented
                        label="filters container"
                        value={filtersUi}
                        onChange={(next) => customize(setFiltersUi, next)}
                        options={[
                          { value: "popover", label: "Popover" },
                          { value: "drawer", label: "Drawer" },
                          { value: "header", label: "Header" },
                        ]}
                      />
                    </Control>
                    <Control label="Density">
                      <Segmented
                        label="density"
                        value={density}
                        onChange={(next) => customize(setDensity, next)}
                        options={[
                          { value: "comfortable", label: "Comfortable" },
                          { value: "compact", label: "Compact" },
                        ]}
                      />
                    </Control>
                    <Toggle
                      label="Motion"
                      value={motion}
                      onChange={(next) => customize(setMotion, next)}
                    />
                  </ControlPanel>

                  <ControlPanel title="Structure">
                    <Control label="Row structure">
                      <Segmented
                        label="row structure"
                        value={structure}
                        onChange={changeStructure}
                        options={[
                          { value: "flat", label: "Flat" },
                          {
                            value: "grouped",
                            label: "Grouped",
                            disabled: Boolean(clientOnlyReason),
                            title: clientOnlyReason,
                          },
                          {
                            value: "tree",
                            label: "Tree",
                            disabled: Boolean(clientOnlyReason),
                            title: clientOnlyReason,
                          },
                          {
                            value: "nested",
                            label: "Detail",
                            disabled: Boolean(clientOnlyReason),
                            title: clientOnlyReason,
                          },
                        ]}
                      />
                    </Control>
                    <Toggle
                      label="Column groups"
                      value={columnGroups}
                      onChange={(next) => customize(setColumnGroups, next)}
                    />
                    <Toggle
                      label="Sparkline column"
                      value={sparkline}
                      onChange={(next) => customize(setSparkline, next)}
                    />
                    <Toggle
                      label="Boolean & multi-select editors"
                      value={editorShowcase}
                      onChange={(next) => customize(setEditorShowcase, next)}
                    />
                    <Toggle
                      label="Status bar"
                      value={statusBar}
                      onChange={(next) => customize(setStatusBar, next)}
                    />
                    <Toggle
                      label="Undo / Redo buttons"
                      value={undoRedo}
                      disabledOn={
                        editingMode === "off"
                          ? "Turn on an editing mode first — the buttons drive the edit history."
                          : undefined
                      }
                      onChange={(next) => customize(setUndoRedo, next)}
                    />
                    <Toggle
                      label="Side panel"
                      value={settingsPanel}
                      onChange={(next) => customize(setSettingsPanel, next)}
                    />
                  </ControlPanel>

                  <ControlPanel title="Editing">
                    <Control label="Editing mode">
                      <Segmented
                        label="editing mode"
                        value={editingMode}
                        onChange={(next) => customize(setEditingMode, next)}
                        options={[
                          { value: "off", label: "Off" },
                          {
                            value: "cell",
                            label: "Cell",
                            disabled: Boolean(clientOnlyReason),
                            title: clientOnlyReason,
                          },
                          {
                            value: "row",
                            label: "Row",
                            disabled: Boolean(clientOnlyReason),
                            title: clientOnlyReason,
                          },
                          {
                            value: "batch",
                            label: "Batch",
                            disabled: Boolean(clientOnlyReason),
                            title: clientOnlyReason,
                          },
                        ]}
                      />
                    </Control>
                  </ControlPanel>

                  <ControlPanel title="Rows">
                    <Toggle
                      label="Add / delete"
                      value={rowMutations}
                      disabledOn={clientOnlyReason}
                      onChange={(next) => customize(setRowMutations, next)}
                    />
                    <Toggle
                      label="Reorder"
                      value={rowReorder}
                      disabledOn={reorderReason}
                      onChange={(next) => customize(setRowReorder, next)}
                    />
                    <Toggle
                      label="Pin rows"
                      value={rowPinning}
                      disabledOn={pinReason}
                      onChange={(next) => customize(setRowPinning, next)}
                    />
                    <Toggle
                      label="Span cells"
                      value={cellSpan}
                      disabledOn={clientOnlyReason}
                      onChange={(next) => customize(setCellSpan, next)}
                    />
                    <Toggle
                      label="Extra rows"
                      value={extraRows}
                      disabledOn={clientOnlyReason}
                      onChange={(next) => customize(setExtraRows, next)}
                    />
                    <Toggle
                      label="Row style"
                      value={rowStyle}
                      disabledOn={clientOnlyReason}
                      onChange={(next) => customize(setRowStyle, next)}
                    />
                  </ControlPanel>
                </aside>
              </>
            }
            activeFilterCount={recipe === "baseline" && locale === "en" ? 0 : 1}
            onClearFilters={resetOptions}
            labels={FEATURE_LAB_DRAWER_LABELS}
          />
        </MantineProvider>

        <div className="lab-preview">
          {!controlsOpen && (
            <div className="visually-hidden" role="status">
              {configSummary}
            </div>
          )}
          <div className="lab-summary">
            <strong>
              {RECIPES.find((item) => item.key === recipe)?.label ?? "Custom"}
            </strong>
            <span>
              {mode} · {filtersUi} filters · {structure} rows ·{" "}
              {interactionSummary}
            </span>
            {compatibilityNote}
          </div>

          <div
            className="demo-surface demo-surface--flush"
            style={cssVars({ "--c": accent })}
          >
            <div
              className="demo-surface__body"
              key={adapter}
              data-adapter={adapter}
            >
              <Suspense fallback={<DemoFallback />}>
                <DemoFilterSetProvider value={filterSet}>
                  <AdvancedFiltersProvider value={advancedFilters}>
                    <Demo
                      mode={mode}
                      locale={locale}
                      dark={dark}
                      density={density}
                      filtersUi={filtersUi}
                      headerFilters={filtersUi === "header"}
                      columnGroups={columnGroups === "on"}
                      sparkline={sparkline === "on"}
                      editorShowcase={editorShowcase === "on"}
                      statusBar={statusBar === "on"}
                      undoRedoButtons={undoRedo === "on"}
                      sidePanel={
                        settingsPanel === "on"
                          ? {
                              panels: SIDE_PANELS,
                              open: openPanel,
                              onOpenChange: setOpenPanel,
                            }
                          : undefined
                      }
                      animate={motion === "on"}
                      grouping={structure === "grouped"}
                      tree={structure === "tree"}
                      nested={structure === "nested"}
                      editing={editingMode === "cell"}
                      rowMode={editingMode === "row"}
                      batch={editingMode === "batch"}
                      rowMutations={rowMutations === "on"}
                      rowReorder={rowReorder === "on"}
                      rowPinning={rowPinning === "on"}
                      cellSpan={cellSpan === "on"}
                      extraRows={extraRows === "on"}
                      rowStyle={rowStyle === "on"}
                      urlKey="lab"
                    />
                  </AdvancedFiltersProvider>
                </DemoFilterSetProvider>
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
