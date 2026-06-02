import { getDirection, getLabels } from "@adapttable/i18n";
import { DataTable } from "@adapttable/mantine";
import { Checkbox, MantineProvider, Stack } from "@mantine/core";

import {
  type Locale,
  makeActions,
  makeColumns,
  makeFilterLabels,
  selectedTeams,
  strings,
  TEAMS,
} from "../data";
import { type DataMode, DemoBody } from "../Demo";

export function MantineDemo({
  mode,
  locale,
}: Readonly<{ mode: DataMode; locale: Locale }>) {
  const s = strings(locale);
  return (
    <MantineProvider>
      <DemoBody
        mode={mode}
        render={(source) => (
          <DataTable
            source={source}
            columns={makeColumns(locale)}
            rowKey={(r) => r.id}
            labels={getLabels(locale)}
            dir={getDirection(locale)}
            searchPlaceholder={s.search}
            rowActions={makeActions(locale)}
            virtualize
            estimateRowSize={56}
            estimateCardSize={140}
            stickyTop={12}
            filterLabels={makeFilterLabels(locale)}
            onClearFilters={() => source.setExtra("team", undefined)}
            filters={
              <Checkbox.Group
                label={s.team}
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
