import {
  type BulkAction,
  type ConfirmHandler,
  type SelectionState,
  type TableLabels,
  useBulkActionRunner,
} from "@adapttable/core";
import { Button, Group, Text, Tooltip } from "@mantine/core";

/** Props for {@link BulkActionBar}. */
export interface BulkActionBarProps {
  selection: SelectionState;
  bulkActions: BulkAction[];
  confirm: ConfirmHandler;
  labels: Required<TableLabels>;
}

/** Selection toolbar: count, clear, and the configured bulk-action buttons. */
export function BulkActionBar({
  selection,
  bulkActions,
  confirm,
  labels,
}: Readonly<BulkActionBarProps>) {
  const { selectedIds, selectedCount, clear } = selection;
  const { pending, run } = useBulkActionRunner({
    confirm,
    cancelLabel: labels.cancel,
    onComplete: clear,
  });

  if (selectedCount === 0) return null;

  const ids = [...selectedIds];
  return (
    <Group justify="space-between" wrap="wrap" gap="sm">
      <Text fz="sm">{labels.selectedCount(selectedCount)}</Text>
      <Group gap="xs" wrap="wrap">
        <Button
          size="xs"
          variant="subtle"
          onClick={clear}
          disabled={pending !== null}
        >
          {labels.clearAll}
        </Button>
        {bulkActions.map((action) => (
          <BulkButton
            key={action.key}
            action={action}
            ids={ids}
            pending={pending}
            onRun={(a) => run(a, ids)}
          />
        ))}
      </Group>
    </Group>
  );
}

function BulkButton({
  action,
  ids,
  pending,
  onRun,
}: Readonly<{
  action: BulkAction;
  ids: string[];
  pending: string | null;
  onRun: (action: BulkAction) => void;
}>) {
  const reason = action.disabledReason?.(ids);
  const ineligible = reason !== undefined;
  const button = (
    <Button
      size="xs"
      color={action.color}
      leftSection={action.icon}
      onClick={() => onRun(action)}
      loading={pending === action.key}
      disabled={ineligible || (pending !== null && pending !== action.key)}
    >
      {action.label}
    </Button>
  );
  if (reason !== undefined) {
    return (
      <Tooltip label={reason} withArrow openDelay={150}>
        <div>{button}</div>
      </Tooltip>
    );
  }
  return button;
}
