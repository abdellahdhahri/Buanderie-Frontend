import React from "react";

// Double flèche de tri : les deux grises au repos, la flèche active en couleur
function SortArrows({ direction }) {
  return (
    <span className="premium-table__arrows" aria-hidden="true">
      <svg viewBox="0 0 10 6" className={direction === "asc" ? "is-active" : ""}>
        <path d="M1 5l4-4 4 4" />
      </svg>
      <svg viewBox="0 0 10 6" className={direction === "desc" ? "is-active" : ""}>
        <path d="M1 1l4 4 4-4" />
      </svg>
    </span>
  );
}

/**
 * En-tête de colonne triable (à utiliser avec useSortableData).
 *   direction : "asc" | "desc" | null
 *   onSort    : appelé au clic
 *   align     : "left" | "center" | "right"
 */
export function SortableHeader({ children, direction, onSort, align = "left", className = "", style }) {
  const ariaSort = direction === "asc" ? "ascending" : direction === "desc" ? "descending" : "none";
  return (
    <th aria-sort={ariaSort} className={`premium-table__th--sortable ${className}`} style={{ textAlign: align, ...style }}>
      <button
        type="button"
        onClick={onSort}
        className={`premium-table__sort ${direction ? "is-sorted" : ""}`}
        style={{ justifyContent: align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start" }}
      >
        <span>{children}</span>
        <SortArrows direction={direction} />
      </button>
    </th>
  );
}
