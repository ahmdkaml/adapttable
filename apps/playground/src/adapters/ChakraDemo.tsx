import { DataTable } from "@adapttable/chakra";
import {
  ChakraProvider,
  Checkbox,
  CheckboxGroup,
  FormLabel,
  Stack,
} from "@chakra-ui/react";

import {
  columns,
  editAction,
  selectedTeams,
  TEAM_FILTER_LABELS,
  TEAMS,
} from "../data";
import { type DataMode, DemoBody } from "../Demo";

export function ChakraDemo({ mode }: Readonly<{ mode: DataMode }>) {
  return (
    <ChakraProvider>
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
              <>
                <FormLabel>Team</FormLabel>
                <CheckboxGroup
                  value={selectedTeams(source.extra.team)}
                  onChange={(value) =>
                    source.setExtra("team", value as string[])
                  }
                >
                  <Stack>
                    {TEAMS.map((t) => (
                      <Checkbox key={t} value={t}>
                        {t}
                      </Checkbox>
                    ))}
                  </Stack>
                </CheckboxGroup>
              </>
            }
          />
        )}
      />
    </ChakraProvider>
  );
}
