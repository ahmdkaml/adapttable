import { DataTable } from "@adapttable/mui";
import {
  Checkbox,
  FormControlLabel,
  FormGroup,
  FormLabel,
} from "@mui/material";

import {
  columns,
  editAction,
  selectedTeams,
  TEAM_FILTER_LABELS,
  TEAMS,
  toggleTeam,
} from "../data";
import { type DataMode, DemoBody } from "../Demo";

export function MuiDemo({ mode }: Readonly<{ mode: DataMode }>) {
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
            searchPlaceholder="Search people…"
            rowActions={[editAction]}
            filterLabels={TEAM_FILTER_LABELS}
            onClearFilters={() => source.setExtra("team", undefined)}
            filters={
              <FormGroup>
                <FormLabel>Team</FormLabel>
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
