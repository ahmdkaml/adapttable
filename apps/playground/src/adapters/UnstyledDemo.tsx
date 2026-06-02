import { getDirection, getLabels } from "@adapttable/i18n";
import { DataTable } from "@adapttable/unstyled";

import {
  columns,
  editAction,
  selectedTeams,
  TEAM_FILTER_LABELS,
  TEAMS,
  toggleTeam,
} from "../data";
import { type DataMode, DemoBody } from "../Demo";

// The unstyled adapter ships no CSS — you bring the classes. These are
// Tailwind utilities (loaded via the Play CDN in index.html).
export function UnstyledDemo({ mode }: Readonly<{ mode: DataMode }>) {
  return (
    <DemoBody
      mode={mode}
      render={(source) => {
        const selected = selectedTeams(source.extra.team);
        return (
          <DataTable
            source={source}
            columns={columns}
            rowKey={(r) => r.id}
            labels={getLabels("en")}
            dir={getDirection("en")}
            rowActions={[editAction]}
            filterLabels={TEAM_FILTER_LABELS}
            onClearFilters={() => source.setExtra("team", undefined)}
            filters={
              <fieldset className="flex flex-col gap-1">
                <legend className="mb-1 font-medium">Team</legend>
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
            classNames={{
              root: "rounded-lg border border-zinc-200 p-3",
              toolbar: "flex items-center gap-2 mb-2",
              search: "rounded border px-2 py-1 text-sm",
              table: "w-full text-sm",
              headerCell: "text-start font-medium text-zinc-500 px-3 py-2",
              sortButton: "inline-flex items-center gap-1",
              row: "border-t hover:bg-zinc-50 data-[selected]:bg-blue-50",
              cell: "px-3 py-2",
              footer: "flex items-center gap-2 mt-2 text-sm",
              pageButton: "rounded border px-2 py-1 disabled:opacity-40",
            }}
          />
        );
      }}
    />
  );
}
