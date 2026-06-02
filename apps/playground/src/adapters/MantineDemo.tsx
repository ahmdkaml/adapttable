import { type ExtraFilters } from "@adapttable/core";
import { DataTable, useFrontendData } from "@adapttable/mantine";
import { Checkbox, MantineProvider, Stack } from "@mantine/core";

import { columns, editAction, PEOPLE, type Person } from "../data";

const TEAMS = ["Core", "Platform", "Data", "Web"];

/** Client-side filter predicate driven by the drawer's Team checkboxes. */
function matchesTeam(row: Person, extra: ExtraFilters): boolean {
  const team = extra.team;
  if (team == null) return true;
  const selected = Array.isArray(team) ? team : [String(team)];
  return selected.length === 0 || selected.includes(row.team);
}

export function MantineDemo() {
  const source = useFrontendData({
    data: PEOPLE,
    columns,
    arrayExtraKeys: ["team"],
    filterFn: matchesTeam,
  });
  const team = source.extra.team;
  let selected: string[] = [];
  if (Array.isArray(team)) selected = team;
  else if (team != null) selected = [String(team)];

  return (
    <MantineProvider>
      <DataTable
        source={source}
        columns={columns}
        rowKey={(r) => r.id}
        searchPlaceholder="Search people…"
        rowActions={[editAction]}
        filterLabels={{ team: (value) => `Team: ${value}` }}
        onClearFilters={() => source.setExtra("team", undefined)}
        filters={
          <Checkbox.Group
            label="Team"
            value={selected}
            onChange={(value) => source.setExtra("team", value)}
          >
            <Stack gap="xs" mt="xs">
              {TEAMS.map((t) => (
                <Checkbox key={t} value={t} label={t} />
              ))}
            </Stack>
          </Checkbox.Group>
        }
      />
    </MantineProvider>
  );
}
