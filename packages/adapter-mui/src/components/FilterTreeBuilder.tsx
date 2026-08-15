import {
  type FilterTreeBuilderProps,
  type FilterTreeButtonProps,
  FilterTreeChrome,
  type FilterTreeDisclosureProps,
  type FilterTreeInputProps,
  type FilterTreeSelectProps,
  type FilterTreeSlots,
} from "@adapttable/core/adapter";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  MenuItem,
  TextField,
} from "@mui/material";

export type { FilterTreeBuilderProps };

function TreeSelect({
  label,
  value,
  part,
  options,
  className,
  onChange,
}: FilterTreeSelectProps) {
  return (
    <TextField
      select
      size="small"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      data-adapttable-part={part}
      className={className}
      slotProps={{
        htmlInput: { "aria-label": label },
        select: { native: false },
      }}
      sx={{ flex: "1 1 8.5rem", minWidth: "8.5rem" }}
    >
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );
}

function TreeInput({
  label,
  value,
  type,
  className,
  onChange,
}: FilterTreeInputProps) {
  return (
    <TextField
      size="small"
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      data-adapttable-part="filter-input"
      className={className}
      slotProps={{ htmlInput: { "aria-label": label } }}
      sx={{ flex: "1 1 7rem", minWidth: "7rem" }}
    />
  );
}

function TreeButton({
  label,
  part,
  className,
  onClick,
}: FilterTreeButtonProps) {
  return (
    <Button
      type="button"
      size="small"
      data-adapttable-part={part}
      className={className}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

function TreeDisclosure({
  label,
  expanded,
  className,
  summaryClassName,
  children,
  onExpandedChange,
}: FilterTreeDisclosureProps) {
  return (
    <Accordion
      disableGutters
      elevation={0}
      expanded={expanded}
      className={className}
      data-adapttable-part="filter-tree"
      onChange={(_, next) => onExpandedChange(next)}
      sx={{
        mt: 0.5,
        pt: 1,
        borderTop: 1,
        borderColor: "divider",
        background: "transparent",
        "&::before": { display: "none" },
      }}
    >
      <AccordionSummary
        className={summaryClassName}
        data-adapttable-part="filter-tree-summary"
        expandIcon={<span aria-hidden>▾</span>}
        sx={{
          minHeight: 32,
          px: 0,
          "& .MuiAccordionSummary-content": { my: 0 },
        }}
      >
        {label}
      </AccordionSummary>
      <AccordionDetails sx={{ p: 0 }}>{children}</AccordionDetails>
    </Accordion>
  );
}

const slots: FilterTreeSlots = {
  Select: TreeSelect,
  Input: TreeInput,
  Button: TreeButton,
  Disclosure: TreeDisclosure,
};

/** MUI AND/OR builder — compact kit Select / TextField / Button, no stacked labels. */
export function FilterTreeBuilder<TRow>(
  props: Readonly<FilterTreeBuilderProps<TRow>>
) {
  return <FilterTreeChrome {...props} slots={slots} />;
}
