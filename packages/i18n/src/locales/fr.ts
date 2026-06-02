import type { TableLabels } from "@adapttable/core";

/** French (`fr`) label preset. */
export const fr: Required<TableLabels> = {
  search: "Rechercher",
  searchPlaceholder: "Rechercher…",
  noData: "Aucune donnée",
  loading: "Chargement…",
  loadMore: "Charger plus",
  filters: "Filtres",
  clearAll: "Tout effacer",
  applyFilters: "Appliquer les filtres",
  sortBy: "Trier par",
  rowsPerPage: "Lignes par page",
  actions: "Actions",
  selectAll: "Tout sélectionner",
  selectRow: "Sélectionner la ligne",
  cancel: "Annuler",
  retry: "Réessayer",
  errorTitle: "Une erreur s'est produite",
  errorMessage: "Impossible de charger ces données.",
  previousPage: "Page précédente",
  nextPage: "Page suivante",
  goToPage: (page) => `Aller à la page ${page}`,
  selectedCount: (count) => `${count} sélectionné(s)`,
  showing: ({ from, to, total }) => `Affichage de ${from}–${to} sur ${total}`,
  pageOf: ({ page, total }) => `Page ${page} sur ${total}`,
};
