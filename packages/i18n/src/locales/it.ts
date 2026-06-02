import type { TableLabels } from "@adapttable/core";

/** Italian (`it`) label preset. */
export const it: Required<TableLabels> = {
  search: "Cerca",
  searchPlaceholder: "Cerca…",
  noData: "Nessun dato",
  loading: "Caricamento…",
  loadMore: "Carica altro",
  filters: "Filtri",
  clearAll: "Cancella tutto",
  applyFilters: "Applica filtri",
  sortBy: "Ordina per",
  rowsPerPage: "Righe per pagina",
  actions: "Azioni",
  selectAll: "Seleziona tutto",
  selectRow: "Seleziona riga",
  cancel: "Annulla",
  retry: "Riprova",
  errorTitle: "Qualcosa è andato storto",
  errorMessage: "Impossibile caricare questi dati.",
  previousPage: "Pagina precedente",
  nextPage: "Pagina successiva",
  goToPage: (page) => `Vai alla pagina ${page}`,
  selectedCount: (count) => `${count} selezionati`,
  showing: ({ from, to, total }) => `Visualizzazione ${from}–${to} di ${total}`,
  pageOf: ({ page, total }) => `Pagina ${page} di ${total}`,
};
