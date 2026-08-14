---
"@adapttable/core": minor
"@adapttable/antd": patch
"@adapttable/base-ui": patch
"@adapttable/chakra": patch
"@adapttable/mantine": patch
"@adapttable/mui": patch
"@adapttable/radix": patch
"@adapttable/shadcn": patch
"@adapttable/unstyled": patch
---

Bring your own cell editor

`editor: { type: "custom", render }` puts any React component in the cell — an
autocomplete, a rich-text field, a colour picker. The table keeps everything it
already owned: double-click / Enter / F2 activates, focus returns to the cell
afterwards, Enter commits, Escape cancels, Tab moves on, and validators gate the
commit.

What the component receives is `draft` and the calls that change it — `setDraft`,
`commit` (for a picker, where choosing IS the gesture), `cancel`, `onKeyDown`,
`onBlur`, and `focusRef` to point at what should take focus — plus `error`,
`validating` and `errorId` so it can mark itself invalid. `parseValue` still
turns the draft into whatever gets stored.

Rendered by the gate, so it is the same component in all nine adapters.

Headless: `CustomCellEditorRender`, `CustomCellEditorCtrl`, `isCustomEditor`, and
`commit` / `cancel` on the editable-cell controller.
