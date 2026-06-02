import { DataTable } from "@adapttable/chakra";
import { getDirection, getLabels } from "@adapttable/i18n";
import {
  ChakraProvider,
  Checkbox,
  CheckboxGroup,
  FormLabel,
  Stack,
} from "@chakra-ui/react";

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

export function ChakraDemo({
  mode,
  locale,
}: Readonly<{ mode: DataMode; locale: Locale }>) {
  const s = strings(locale);
  return (
    <ChakraProvider>
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
            filterLabels={makeFilterLabels(locale)}
            onClearFilters={() => source.setExtra("team", undefined)}
            filters={
              <>
                <FormLabel>{s.team}</FormLabel>
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
