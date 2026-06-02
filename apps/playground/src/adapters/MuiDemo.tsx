import { getDirection, getLabels } from "@adapttable/i18n";
import { DataTable } from "@adapttable/mui";
import {
  Checkbox,
  FormControlLabel,
  FormGroup,
  FormLabel,
} from "@mui/material";

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

export function MuiDemo({
  mode,
  locale,
}: Readonly<{ mode: DataMode; locale: Locale }>) {
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
            virtualize
            estimateRowSize={56}
            estimateCardSize={140}
            filterLabels={makeFilterLabels(locale)}
            onClearFilters={() => source.setExtra("team", undefined)}
            filters={
              <FormGroup>
                <FormLabel>{s.team}</FormLabel>
                {TEAMS.map((t) => (
                  <FormControlLabel
                    key={t}
                    label={t}
                    control={
                      <Checkbox
                        checked={selected.includes(t)}
                        onChange={() =>
                          source.setExtra("team", toggleTeam(selected, t))
                        }
                      />
                    }
                  />
                ))}
              </FormGroup>
            }
          />
        );
      }}
    />
  );
}
