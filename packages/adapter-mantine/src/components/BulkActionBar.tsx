import type { BulkAction, SelectionState, TableLabels } from "@adapttable/core";
import { Button, Group, Text, Tooltip } from "@mantine/core";
import { useCallback, useState } from "react";

import type { ConfirmHandler } from "../types";

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
  const [pending, setPending] = useState<string | null>(null);
  const { selectedIds, selectedCount, clear } = selection;

  const run = useCallback(
    (action: BulkAction) => {
      const ids = [...selectedIds];
      if (ids.length === 0) return;
      const fire = async () => {
        try {
          setPending(action.key);
          await action.onClick(ids);
          clear();
        } finally {
          setPending(null);
        }
      };
      if (action.confirm) {
        confirm({
          title: action.confirm.title,
          message: action.confirm.message(ids.length),
          confirmLabel: action.confirm.confirmLabel,
          cancelLabel: labels.cancel,
          danger: action.confirm.danger,
          onConfirm: () => void fire(),
        });
      } else {
        void fire();
      }
    },
    [selectedIds, clear, confirm, labels.cancel]
  );

  if (selectedCount === 0) return null;

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
            ids={[...selectedIds]}
            pending={pending}
            onRun={run}
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
