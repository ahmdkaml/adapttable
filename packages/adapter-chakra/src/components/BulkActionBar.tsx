/** Selection bar with the bulk actions and cross-page banner. */
import {
  type BulkBarChromeProps,
  resolveDisabledReason,
  useBulkBarState,
} from "@adapttable/core/adapter";
import { Button, HStack, Text } from "@chakra-ui/react";
import { isValidElement } from "react";

import { Tooltip } from "./primitives";

/** Selection toolbar. */
export function BulkBar({
  selection,
  total,
  bulkActions,
  confirm,
  labels,
  accentColor,
}: Readonly<BulkBarChromeProps & { accentColor?: string }>) {
  const {
    selectedCount,
    ids,
    pending,
    errorMessage,
    run,
    clear,
    expandable,
    scope,
    banner,
  } = useBulkBarState({ selection, total, confirm, labels });
  if (selectedCount === 0) return null;
  return (
    <HStack gap={2} justify="space-between" flexWrap="wrap">
      {expandable ? (
        <HStack gap={2} flexWrap="wrap">
          <Text fontSize="sm">{banner.text}</Text>
          <Button
            size="xs"
            variant="plain"
            colorPalette={accentColor}
            disabled={pending !== null}
            onClick={banner.onClick}
          >
            {banner.action}
          </Button>
        </HStack>
      ) : (
        <Text fontSize="sm">{labels.selectedCount(selectedCount)}</Text>
      )}
      <HStack gap={2} flexWrap="wrap">
        <Button
          size="xs"
          variant="ghost"
          onClick={clear}
          disabled={pending !== null}
        >
          {labels.clearAll}
        </Button>
        {bulkActions.map((action) => {
          const reason = resolveDisabledReason(action.disabledReason?.(ids));
          return (
            <Tooltip key={action.key} label={reason ?? ""} disabled={!reason}>
              <Button
                size="xs"
                colorPalette={action.color ?? accentColor}
                disabled={reason !== undefined || pending !== null}
                onClick={() => run(action, ids, scope)}
              >
                {isValidElement(action.icon) ? action.icon : null}
                {action.label}
              </Button>
            </Tooltip>
          );
        })}
        {errorMessage !== null && (
          <Text fontSize="sm" color="red.500" role="alert">
            {`${labels.errorTitle}: ${errorMessage}`}
          </Text>
        )}
      </HStack>
    </HStack>
  );
}
