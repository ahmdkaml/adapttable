import {
  type FilterTreeBuilderProps,
  type FilterTreeButtonProps,
  FilterTreeChrome,
  type FilterTreeDisclosureProps,
  type FilterTreeInputProps,
  type FilterTreeSelectProps,
  type FilterTreeSlots,
} from "@adapttable/core/adapter";

import { Button, Flex, TextField } from "../ui";
import { NativeSelect } from "./primitives";

export type { FilterTreeBuilderProps };

function TreeSelect({
  label,
  value,
  part,
  options,
  onChange,
}: FilterTreeSelectProps) {
  return (
    <div style={{ flex: "1 1 8.5rem", minWidth: "8.5rem" }}>
      <NativeSelect
        size="1"
        width="100%"
        aria-label={label}
        data-adapttable-part={part}
        value={value}
        options={options}
        onValueChange={onChange}
      />
    </div>
  );
}

function TreeInput({ label, value, type, onChange }: FilterTreeInputProps) {
  return (
    <TextField.Root
      size="1"
      type={type}
      aria-label={label}
      data-adapttable-part="filter-input"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      style={{ flex: "1 1 7rem", minWidth: "7rem" }}
    />
  );
}

function TreeButton({ label, part, onClick }: FilterTreeButtonProps) {
  return (
    <Button
      type="button"
      size="1"
      variant="soft"
      data-adapttable-part={part}
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
    <Flex
      direction="column"
      gap="2"
      className={className}
      data-adapttable-part="filter-tree"
      style={{
        marginBlockStart: 4,
        paddingBlockStart: 8,
        borderBlockStart: "1px solid var(--adapttable-border)",
      }}
    >
      <Button
        type="button"
        size="1"
        variant="ghost"
        className={summaryClassName}
        aria-expanded={expanded}
        data-adapttable-part="filter-tree-summary"
        onClick={() => onExpandedChange(!expanded)}
        style={{ justifyContent: "space-between" }}
      >
        {label}
        <span aria-hidden>{expanded ? "▴" : "▾"}</span>
      </Button>
      {expanded ? children : null}
    </Flex>
  );
}

const slots: FilterTreeSlots = {
  Select: TreeSelect,
  Input: TreeInput,
  Button: TreeButton,
  Disclosure: TreeDisclosure,
};

/** Base UI AND/OR builder — compact kit row, no stacked field labels. */
export function FilterTreeBuilder<TRow>(
  props: Readonly<FilterTreeBuilderProps<TRow>>
) {
  return <FilterTreeChrome {...props} slots={slots} />;
}
