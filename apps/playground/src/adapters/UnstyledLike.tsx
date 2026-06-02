import { getDirection, getLabels } from "@adapttable/i18n";
import { DataTable, type DataTableClassNames } from "@adapttable/unstyled";

import {
  type Locale,
  makeActions,
  makeColumns,
  makeFilterLabels,
  selectedTeams,
  strings,
  TEAMS,
  toggleTeam,
} from "../data";
import { type DataMode, DemoBody } from "../Demo";

/**
 * Shared renderer for the two class-driven demos (plain Tailwind and
 * shadcn-style). The unstyled adapter ships no CSS — these `classNames`
 * (Tailwind utilities via the Play CDN) are the entire look.
 */
export function UnstyledLike({
  mode,
  locale,
  classNames,
}: Readonly<{
  mode: DataMode;
  locale: Locale;
  classNames: DataTableClassNames;
}>) {
  const s = strings(locale);
  return (
    <DemoBody
      mode={mode}
      render={(source) => {
        const selected = selectedTeams(source.extra.team);
        return (
          <DataTable
            source={source}
            columns={makeColumns(locale)}
            rowKey={(r) => r.id}
            labels={getLabels(locale)}
            dir={getDirection(locale)}
            searchPlaceholder={s.search}
            rowActions={makeActions(locale)}
            filterLabels={makeFilterLabels(locale)}
            onClearFilters={() => source.setExtra("team", undefined)}
            classNames={classNames}
            filters={
              <fieldset className="flex flex-col gap-1.5">
                <legend className="mb-1 font-medium">{s.team}</legend>
                {TEAMS.map((t) => (
                  <label key={t} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selected.includes(t)}
                      onChange={() =>
                        source.setExtra("team", toggleTeam(selected, t))
                      }
                    />
                    {t}
                  </label>
                ))}
              </fieldset>
            }
          />
        );
      }}
    />
  );
}
