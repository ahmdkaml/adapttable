import type { TableLabels } from "@adapttable/core";

/** Spanish (`es`) label preset. */
export const es: Required<TableLabels> = {
  table: "Tabla de datos",
  search: "Buscar",
  searchPlaceholder: "Buscar…",
  noData: "Sin datos",
  loading: "Cargando…",
  loadMore: "Cargar más",
  filters: "Filtros",
  clearAll: "Borrar todo",
  applyFilters: "Listo",
  sortBy: "Ordenar por",
  rowsPerPage: "Filas por página",
  actions: "Acciones",
  selectAll: "Seleccionar todo",
  selectRow: "Seleccionar fila",
  cancel: "Cancelar",
  retry: "Reintentar",
  errorTitle: "Algo salió mal",
  errorMessage: "No se pudieron cargar estos datos.",
  previousPage: "Página anterior",
  nextPage: "Página siguiente",
  goToPage: (page) => `Ir a la página ${page}`,
  selectedCount: (count) => `${count} seleccionados`,
  showing: ({ from, to, total }) => `Mostrando ${from}–${to} de ${total}`,
  pageOf: ({ page, total }) => `Página ${page} de ${total}`,
};
