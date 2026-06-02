import type { TableLabels } from "@adapttable/core";

/** Portuguese (`pt`) label preset. */
export const pt: Required<TableLabels> = {
  search: "Pesquisar",
  searchPlaceholder: "Pesquisar…",
  noData: "Sem dados",
  loading: "Carregando…",
  loadMore: "Carregar mais",
  filters: "Filtros",
  clearAll: "Limpar tudo",
  applyFilters: "Aplicar filtros",
  sortBy: "Ordenar por",
  rowsPerPage: "Linhas por página",
  actions: "Ações",
  selectAll: "Selecionar tudo",
  selectRow: "Selecionar linha",
  cancel: "Cancelar",
  retry: "Tentar novamente",
  errorTitle: "Algo deu errado",
  errorMessage: "Não foi possível carregar estes dados.",
  previousPage: "Página anterior",
  nextPage: "Próxima página",
  goToPage: (page) => `Ir para a página ${page}`,
  selectedCount: (count) => `${count} selecionados`,
  showing: ({ from, to, total }) => `Mostrando ${from}–${to} de ${total}`,
  pageOf: ({ page, total }) => `Página ${page} de ${total}`,
};
