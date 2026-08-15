import { startTransition, Suspense, useState } from "react";

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

export function AllOptionsDemo({ dark }: Readonly<{ dark: boolean }>) {
  const [adapter, setAdapter] = useState(readKitFromUrl);
  const [mode, setMode] = useState<DataMode>("frontend");
  const [locale, setLocale] = useState<Locale>("en");
  const [density, setDensity] = useState<Density>("comfortable");
  const [filtersUi, setFiltersUi] = useState<FiltersUi>("header");
  const [motion, setMotion] = useState<OnOff>("on");
  const [grouping, setGrouping] = useState<OnOff>("off");
  const [tree, setTree] = useState<OnOff>("off");
  const [nested, setNested] = useState<OnOff>("off");
  const [columnGroups, setColumnGroups] = useState<OnOff>("on");
  const [editing, setEditing] = useState<OnOff>("off");
  const [rowMode, setRowMode] = useState<OnOff>("off");
  const [batch, setBatch] = useState<OnOff>("off");
  const [rowMutations, setRowMutations] = useState<OnOff>("off");
  const [rowReorder, setRowReorder] = useState<OnOff>("off");
  const [rowPinning, setRowPinning] = useState<OnOff>("off");
  const [cellSpan, setCellSpan] = useState<OnOff>("off");
  const [extraRows, setExtraRows] = useState<OnOff>("off");
  const [rowStyle, setRowStyle] = useState<OnOff>("off");
  const token =
    ADAPTER_TOKENS.find((a) => a.key === adapter) ?? ADAPTER_TOKENS[0];
  const accent = dark ? token.accentDark : token.accentLight;
  const Demo = ADAPTERS[adapter] ?? ADAPTERS.mantine;

  return (
    <section className="sec shell" id="demo">
      <SectionHead title="Every option, one page. Still one mode at a time.">
        The live demo stays small. This page is the kitchen sink — grouped so
        you can find a control, and wired so filters are popover, drawer, or
        header, never all three.
      </SectionHead>

      <KitSwitcher adapter={adapter} dark={dark} onChange={setAdapter} />

      <div className="opt-board">
        <ControlPanel title="Data and chrome">
          <Control label="Data">
            <Segmented
              label="data source"
              value={mode}
              onChange={(v) => startTransition(() => setMode(v))}
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
              onChange={(v) => startTransition(() => setLocale(v))}
              options={[
                { value: "en", label: "EN" },
                { value: "ar", label: "العربية" },
              ]}
            />
          </Control>
          <Control label="Filters">
            <Segmented
              label="filters container"
              value={filtersUi}
              onChange={(v) => startTransition(() => setFiltersUi(v))}
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
              onChange={(v) => startTransition(() => setDensity(v))}
              options={[
                { value: "comfortable", label: "Comfortable" },
                { value: "compact", label: "Compact" },
              ]}
            />
          </Control>
          <Control label="Motion">
            <Segmented
              label="motion"
              value={motion}
              onChange={(v) => startTransition(() => setMotion(v))}
              options={[
                { value: "on", label: "On" },
                { value: "off", label: "Off" },
              ]}
            />
          </Control>
        </ControlPanel>
        <ControlPanel title="Structure">
          <Control label="Grouping">
            <Segmented
              label="grouping"
              value={grouping}
              onChange={(v) => startTransition(() => setGrouping(v))}
              options={[
                { value: "off", label: "Off" },
                { value: "on", label: "On" },
              ]}
            />
          </Control>
          <Control label="Tree">
            <Segmented
              label="tree"
              value={tree}
              onChange={(v) => startTransition(() => setTree(v))}
              options={[
                { value: "off", label: "Off" },
                { value: "on", label: "On" },
              ]}
            />
          </Control>
          <Control label="Nested">
            <Segmented
              label="nested"
              value={nested}
              onChange={(v) => startTransition(() => setNested(v))}
              options={[
                { value: "off", label: "Off" },
                { value: "on", label: "On" },
              ]}
            />
          </Control>
          <Control label="Column groups">
            <Segmented
              label="column groups"
              value={columnGroups}
              onChange={(v) => startTransition(() => setColumnGroups(v))}
              options={[
                { value: "off", label: "Off" },
                { value: "on", label: "On" },
              ]}
            />
          </Control>
        </ControlPanel>
        <ControlPanel title="Editing">
          <Control label="Editing">
            <Segmented
              label="editing"
              value={editing}
              onChange={(v) => startTransition(() => setEditing(v))}
              options={[
                { value: "off", label: "Off" },
                { value: "on", label: "On" },
              ]}
            />
          </Control>
          <Control label="Row edit">
            <Segmented
              label="row edit"
              value={rowMode}
              onChange={(v) => startTransition(() => setRowMode(v))}
              options={[
                { value: "off", label: "Off" },
                { value: "on", label: "On" },
              ]}
            />
          </Control>
          <Control label="Batch">
            <Segmented
              label="batch"
              value={batch}
              onChange={(v) => startTransition(() => setBatch(v))}
              options={[
                { value: "off", label: "Off" },
                { value: "on", label: "On" },
              ]}
            />
          </Control>
        </ControlPanel>
        <ControlPanel title="Rows">
          <Control label="Add / delete">
            <Segmented
              label="add / delete"
              value={rowMutations}
              onChange={(v) => startTransition(() => setRowMutations(v))}
              options={[
                { value: "off", label: "Off" },
                { value: "on", label: "On" },
              ]}
            />
          </Control>
          <Control label="Reorder">
            <Segmented
              label="reorder"
              value={rowReorder}
              onChange={(v) => startTransition(() => setRowReorder(v))}
              options={[
                { value: "off", label: "Off" },
                { value: "on", label: "On" },
              ]}
            />
          </Control>
          <Control label="Pin rows">
            <Segmented
              label="pin rows"
              value={rowPinning}
              onChange={(v) => startTransition(() => setRowPinning(v))}
              options={[
                { value: "off", label: "Off" },
                { value: "on", label: "On" },
              ]}
            />
          </Control>
          <Control label="Span">
            <Segmented
              label="span cells"
              value={cellSpan}
              onChange={(v) => startTransition(() => setCellSpan(v))}
              options={[
                { value: "off", label: "Off" },
                { value: "on", label: "On" },
              ]}
            />
          </Control>
          <Control label="Extras">
            <Segmented
              label="extra rows"
              value={extraRows}
              onChange={(v) => startTransition(() => setExtraRows(v))}
              options={[
                { value: "off", label: "Off" },
                { value: "on", label: "On" },
              ]}
            />
          </Control>
          <Control label="Style">
            <Segmented
              label="row style"
              value={rowStyle}
              onChange={(v) => startTransition(() => setRowStyle(v))}
              options={[
                { value: "off", label: "Off" },
                { value: "on", label: "On" },
              ]}
            />
          </Control>
        </ControlPanel>
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
            <DemoFilterSetProvider value="kitchen">
              <AdvancedFiltersProvider value={true}>
                <Demo
                  mode={mode}
                  locale={locale}
                  dark={dark}
                  density={density}
                  filtersUi={filtersUi}
                  headerFilters={filtersUi === "header"}
                  columnGroups={columnGroups === "on"}
                  animate={motion === "on"}
                  grouping={grouping === "on"}
                  tree={tree === "on"}
                  nested={nested === "on"}
                  editing={editing === "on"}
                  rowMode={rowMode === "on"}
                  batch={batch === "on"}
                  rowMutations={rowMutations === "on"}
                  rowReorder={rowReorder === "on"}
                  rowPinning={rowPinning === "on"}
                  cellSpan={cellSpan === "on"}
                  extraRows={extraRows === "on"}
                  rowStyle={rowStyle === "on"}
                  urlKey="live"
                />
              </AdvancedFiltersProvider>
            </DemoFilterSetProvider>
          </Suspense>
        </div>
      </div>
    </section>
  );
}
