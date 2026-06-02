import type { TableLabels } from "@adapttable/core";

/** Japanese (`ja`) label preset. */
export const ja: Required<TableLabels> = {
  table: "データテーブル",
  search: "検索",
  searchPlaceholder: "検索…",
  noData: "データがありません",
  loading: "読み込み中…",
  loadMore: "さらに読み込む",
  filters: "フィルター",
  clearAll: "すべてクリア",
  applyFilters: "完了",
  sortBy: "並べ替え",
  rowsPerPage: "1ページの行数",
  actions: "操作",
  selectAll: "すべて選択",
  selectRow: "行を選択",
  cancel: "キャンセル",
  retry: "再試行",
  errorTitle: "問題が発生しました",
  errorMessage: "このデータを読み込めませんでした。",
  previousPage: "前のページ",
  nextPage: "次のページ",
  goToPage: (page) => `${page} ページへ移動`,
  selectedCount: (count) => `${count} 件選択中`,
  showing: ({ from, to, total }) => `${total} 件中 ${from}–${to} 件を表示`,
  pageOf: ({ page, total }) => `${total} ページ中 ${page} ページ`,
};
