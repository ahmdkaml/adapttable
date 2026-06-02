import type { TableLabels } from "@adapttable/core";

/** German (`de`) label preset. */
export const de: Required<TableLabels> = {
  search: "Suchen",
  searchPlaceholder: "Suchen…",
  noData: "Keine Daten",
  loading: "Wird geladen…",
  loadMore: "Mehr laden",
  filters: "Filter",
  clearAll: "Alle löschen",
  applyFilters: "Filter anwenden",
  sortBy: "Sortieren nach",
  rowsPerPage: "Zeilen pro Seite",
  actions: "Aktionen",
  selectAll: "Alle auswählen",
  selectRow: "Zeile auswählen",
  cancel: "Abbrechen",
  retry: "Erneut versuchen",
  errorTitle: "Etwas ist schiefgelaufen",
  errorMessage: "Diese Daten konnten nicht geladen werden.",
  previousPage: "Vorherige Seite",
  nextPage: "Nächste Seite",
  goToPage: (page) => `Zur Seite ${page}`,
  selectedCount: (count) => `${count} ausgewählt`,
  showing: ({ from, to, total }) =>
    `${from}–${to} von ${total} werden angezeigt`,
  pageOf: ({ page, total }) => `Seite ${page} von ${total}`,
};
