import { DataTable } from "@adapttable/mantine";
import { Checkbox, MantineProvider, Stack } from "@mantine/core";

import {
  columns,
  editAction,
  selectedTeams,
  TEAM_FILTER_LABELS,
  TEAMS,
} from "../data";
import { type DataMode, DemoBody } from "../Demo";

export function MantineDemo({ mode }: Readonly<{ mode: DataMode }>) {
  return (
    <MantineProvider>
      <DemoBody
        mode={mode}
        render={(source) => (
          <DataTable
            source={source}
            columns={columns}
            rowKey={(r) => r.id}
            searchPlaceholder="Search people…"
            rowActions={[editAction]}
            filterLabels={TEAM_FILTER_LABELS}
            onClearFilters={() => source.setExtra("team", undefined)}
            filters={
              <Checkbox.Group
                label="Team"
                value={selectedTeams(source.extra.team)}
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
        )}
      />
    </MantineProvider>
  );
}
