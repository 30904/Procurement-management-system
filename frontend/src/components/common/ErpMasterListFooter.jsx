import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  PAGINATION_NEXT_PAGE_ARIA,
  PAGINATION_NEXT_PAGE_TITLE,
  PAGINATION_PREV_PAGE_ARIA,
  PAGINATION_PREV_PAGE_TITLE,
} from "../../utils/paginationNavHandlers.js";

export default function ErpMasterListFooter({
  totalRecords,
  currentPage,
  totalPages,
  onPrevPageClick,
  onNextPageClick,
  hideTotalRecords = false,
}) {
  const safeTotalPages = Math.max(1, Number(totalPages) || 1);
  const safePage = Math.min(Math.max(1, Number(currentPage) || 1), safeTotalPages);

  return (
    <div
      className={`erp-footer-meta${hideTotalRecords ? " erp-footer-meta--pagination-only" : ""}`}
    >
      {!hideTotalRecords ? (
        <span className="erp-footer-records">Total Records {"->"} {totalRecords}</span>
      ) : null}
      <div className="erp-footer-pagination">
        <button
          type="button"
          className="erp-footer-page-btn"
          onClick={onPrevPageClick}
          disabled={safePage <= 1}
          title={PAGINATION_PREV_PAGE_TITLE}
          aria-label={PAGINATION_PREV_PAGE_ARIA}
        >
          <ChevronLeft size={18} strokeWidth={2.25} aria-hidden />
        </button>
        <span className="erp-footer-page-label">
          <span className="erp-footer-page-prefix">Page</span>
          <span className="erp-footer-page-current">{safePage}</span>
          <span className="erp-footer-page-total">of {safeTotalPages}</span>
        </span>
        <button
          type="button"
          className="erp-footer-page-btn"
          onClick={onNextPageClick}
          disabled={safePage >= safeTotalPages}
          title={PAGINATION_NEXT_PAGE_TITLE}
          aria-label={PAGINATION_NEXT_PAGE_ARIA}
        >
          <ChevronRight size={18} strokeWidth={2.25} aria-hidden />
        </button>
      </div>
    </div>
  );
}
