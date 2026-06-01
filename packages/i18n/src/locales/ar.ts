import type { TableLabels } from "@adapttable/core";

/** Arabic (`ar`) label preset. Pairs with `dir="rtl"`. */
export const ar: Required<TableLabels> = {
  search: "بحث",
  searchPlaceholder: "ابحث…",
  noData: "لا توجد بيانات",
  loading: "جارٍ التحميل…",
  loadMore: "تحميل المزيد",
  filters: "عوامل التصفية",
  clearAll: "مسح الكل",
  applyFilters: "تطبيق التصفية",
  sortBy: "ترتيب حسب",
  rowsPerPage: "صفوف لكل صفحة",
  actions: "إجراءات",
  selectAll: "تحديد الكل",
  selectRow: "تحديد الصف",
  cancel: "إلغاء",
  retry: "إعادة المحاولة",
  errorTitle: "حدث خطأ ما",
  errorMessage: "تعذّر تحميل هذه البيانات.",
  previousPage: "الصفحة السابقة",
  nextPage: "الصفحة التالية",
  selectedCount: (count) => `${count} محدد`,
  showing: ({ from, to, total }) => `عرض ${from}–${to} من ${total}`,
  pageOf: ({ page, total }) => `صفحة ${page} من ${total}`,
};
