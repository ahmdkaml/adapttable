import { IconButton } from "@mui/material";

/** The row-expansion chevron, shared by rows and cards. */
import { ExpandChevron } from "./DesktopTable";

/** The per-row expand/collapse chevron button (desktop cell + mobile card). */
export function ExpandToggle({
  id,
  expanded,
  onToggle,
  dir,
  expandLabel,
  collapseLabel,
}: Readonly<{
  id: string;
  expanded: boolean;
  onToggle: (id: string) => void;
  dir?: "ltr" | "rtl";
  expandLabel: string;
  collapseLabel: string;
}>) {
  return (
    <IconButton
      size="small"
      aria-expanded={expanded}
      aria-label={expanded ? collapseLabel : expandLabel}
      onClick={() => onToggle(id)}
    >
      <ExpandChevron expanded={expanded} dir={dir} />
    </IconButton>
  );
}
