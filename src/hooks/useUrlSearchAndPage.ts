import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { SetStateAction } from "react";

export function useUrlSearchAndPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get("search") ?? "";
  const parsedPage = Number(searchParams.get("page") ?? 1);
  const page = Number.isFinite(parsedPage) ? Math.max(1, Math.trunc(parsedPage)) : 1;

  // Keep the text field local while typing. Updating the URL on every key press
  // causes unnecessary router navigations and can interrupt typing/focus.
  const [search, setSearchValue] = useState(urlSearch);
  const lastUrlSearchRef = useRef(urlSearch);

  useEffect(() => {
    if (urlSearch !== lastUrlSearchRef.current) {
      lastUrlSearchRef.current = urlSearch;
      setSearchValue(urlSearch);
    }
  }, [urlSearch]);

  useEffect(() => {
    if (search === urlSearch) return;

    const timeoutId = window.setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      if (search.trim()) next.set("search", search);
      else next.delete("search");
      setSearchParams(next, { replace: true });
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [search, searchParams, setSearchParams, urlSearch]);

  const setSearch = useCallback((value: string) => {
    setSearchValue(value);
  }, []);

  const setPage = useCallback(
    (value: SetStateAction<number>) => {
      const requestedPage = typeof value === "function" ? value(page) : value;
      const nextPage = Number.isFinite(requestedPage)
        ? Math.max(1, Math.trunc(requestedPage))
        : 1;

      // Avoid a second, redundant navigation when a filter changes on page 1.
      if (nextPage === page) return;

      const next = new URLSearchParams(searchParams);
      if (nextPage > 1) next.set("page", String(nextPage));
      else next.delete("page");
      setSearchParams(next, { replace: true });
    },
    [page, searchParams, setSearchParams],
  );

  return { search, setSearch, page, setPage };
}
