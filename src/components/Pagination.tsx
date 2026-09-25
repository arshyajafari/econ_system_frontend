type PaginationProps = {
  page: number;
  lastPage: number;
  isLoading?: boolean;
  total?: number;
  onPageChange: (page: number) => void;
};

const numberFormatter = new Intl.NumberFormat("fa-IR");

function getPageItems(page: number, lastPage: number): Array<number | "ellipsis-start" | "ellipsis-end"> {
  if (lastPage <= 7) return Array.from({ length: lastPage }, (_, index) => index + 1);

  const pages: Array<number | "ellipsis-start" | "ellipsis-end"> = [1];
  if (page > 4) pages.push("ellipsis-start");

  const start = Math.max(2, page - 1);
  const end = Math.min(lastPage - 1, page + 1);
  for (let value = start; value <= end; value += 1) pages.push(value);

  if (page < lastPage - 3) pages.push("ellipsis-end");
  pages.push(lastPage);
  return pages;
}

export function Pagination({ page, lastPage, isLoading = false, total, onPageChange }: PaginationProps) {
  if (lastPage <= 1) return null;

  const items = getPageItems(page, lastPage);

  return (
    <nav aria-label="صفحه‌بندی" className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-xs text-gray-500">
        {total !== undefined ? total.toLocaleString("fa-IR") + " مورد" : "صفحه " + page.toLocaleString("fa-IR") + " از " + lastPage.toLocaleString("fa-IR")}
      </div>

      <div dir="rtl" className="flex items-center justify-center gap-1.5">
        <button type="button" disabled={page <= 1 || isLoading} onClick={() => onPageChange(Math.max(1, page - 1))} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40" aria-label="صفحه قبلی">قبلی</button>

        {items.map((item) =>
          typeof item === "number" ? (
            <button key={item} type="button" disabled={isLoading} aria-current={item === page ? "page" : undefined} onClick={() => onPageChange(item)} className={item === page ? "min-w-9 rounded-lg bg-gray-900 px-2.5 py-2 text-xs font-bold text-white" : "min-w-9 rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-40"}>
              {numberFormatter.format(item)}
            </button>
          ) : (
            <span key={item} className="px-1.5 text-sm text-gray-400" aria-hidden="true">…</span>
          ),
        )}

        <button type="button" disabled={page >= lastPage || isLoading} onClick={() => onPageChange(Math.min(lastPage, page + 1))} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40" aria-label="صفحه بعدی">بعدی</button>
      </div>
    </nav>
  );
}
