import { useMemo } from "react";

/** Tooltip for prev / next page buttons: Ctrl+click (or Cmd on Mac) jumps to first / last page. */
export const PAGINATION_PREV_PAGE_TITLE = "Previous page (Ctrl+click: first page)";
export const PAGINATION_NEXT_PAGE_TITLE = "Next page (Ctrl+click: last page)";
export const PAGINATION_PREV_PAGE_ARIA =
  "Previous page, or first page with Control click";
export const PAGINATION_NEXT_PAGE_ARIA =
  "Next page, or last page with Control click";

/**
 * @param {object} options
 * @param {React.Dispatch<React.SetStateAction<number>>} options.setPage
 * @param {number} options.totalPages — last page number (inclusive, >= 1)
 * @returns {{ onPrevPageClick: (e: React.MouseEvent) => void, onNextPageClick: (e: React.MouseEvent) => void }}
 */
export function createPageNavClickHandlers({ setPage, totalPages }) {
  const lastPage = Math.max(1, Number(totalPages) || 1);

  const onPrevPageClick = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setPage(1);
      return;
    }
    setPage((p) => Math.max(1, p - 1));
  };
  const onNextPageClick = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setPage(lastPage);
      return;
    }
    setPage((p) => Math.min(lastPage, p + 1));
  };
  return { onPrevPageClick, onNextPageClick };
}

function resolvePaginationArgs(arg1, arg2) {
  if (arg1 && typeof arg1 === "object" && "setPage" in arg1) {
    return { setPage: arg1.setPage, totalPages: arg1.totalPages };
  }
  return { setPage: arg1, totalPages: arg2 };
}

/**
 * Stable prev/next click handlers: normal click = step one page; Ctrl/Cmd+click = first/last page.
 * Accepts either `usePageNavClickHandlers(setPage, totalPages)` or `usePageNavClickHandlers({ setPage, totalPages })`.
 */
export function usePageNavClickHandlers(arg1, arg2) {
  const { setPage, totalPages } = resolvePaginationArgs(arg1, arg2);
  return useMemo(
    () => createPageNavClickHandlers({ setPage, totalPages }),
    [setPage, totalPages]
  );
}
