import SearchIcon from "../../assets/search-icon.svg?react";
import "../../styles/subcomponents.css";

/**
 * Search field styled like list-page toolbar (erp-search-wrap).
 */
export default function ModalSearchBar({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
  "aria-label": ariaLabel = "Search",
}) {
  return (
    <div className={`sc-modal-search${className ? ` ${className}` : ""}`}>
      <SearchIcon className="sc-modal-search__icon" aria-hidden />
      <input
        type="search"
        className="sc-modal-search__input"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
      />
    </div>
  );
}
