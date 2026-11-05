import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import type { SetStateAction } from "react";

export function useUrlSearchAndPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") ?? "";
  const parsedPage = Number(searchParams.get("page") ?? 1);
  const page = Number.isFinite(parsedPage) ? Math.max(1, Math.trunc(parsedPage)) : 1;

  const setSearch = useCallback(
    (value: string) => {
      const next = new URLSearchParams(searchParams);
      if (value.trim()) next.set("search", value);
      else next.delete("search");
      next.delete("page");
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const setPage = useCallback(
    (value: SetStateAction<number>) => {
      const requestedPage = typeof value === "function" ? value(page) : value;
      const nextPage = Number.isFinite(requestedPage)
        ? Math.max(1, Math.trunc(requestedPage))
        : 1;
      const next = new URLSearchParams(searchParams);
      if (nextPage > 1) next.set("page", String(nextPage));
      else next.delete("page");
      setSearchParams(next, { replace: true });
    },
    [page, searchParams, setSearchParams],
  );

  return { search, setSearch, page, setPage };
}
