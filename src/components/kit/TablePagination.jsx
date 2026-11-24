import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getPageNumbers } from './helpers';
import './kit.css';

export const PAGE_SIZE = 10;

export const Pagination = ({ total, page, totalPages, pageSize = PAGE_SIZE, onPage, unit = 'ligne(s)' }) => {
  const pages = Math.max(1, totalPages || Math.ceil((total || 0) / pageSize));
  return (
    <div className="table-footer-pagination">
      <div className="pagination-left">
        {total} {unit}
        {total > 0
          ? <> — {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} affichée(s)</>
          : <> — Page 1 / 1</>}
      </div>
      <div className="pagination-right">
        <button type="button" className="pag-btn" disabled={page <= 1} onClick={() => onPage(Math.max(1, page - 1))} title="Page précédente">
          <ChevronLeft size={14} />
        </button>
        {getPageNumbers(page, pages).map((p, i) => (p === '...' ? (
          <span key={`e-${i}`} className="pag-ellipsis">…</span>
        ) : (
          <button key={p} type="button" className={`pag-btn ${p === page ? 'active' : ''}`} onClick={() => onPage(p)} disabled={pages <= 1}>
            {p}
          </button>
        )))}
        <button type="button" className="pag-btn" disabled={page >= pages || pages <= 1} onClick={() => onPage(Math.min(pages, page + 1))} title="Page suivante">
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

export const usePagination = (rows, pageSize = PAGE_SIZE) => {
  const liste = Array.isArray(rows) ? rows : [];
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(liste.length / pageSize));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);
  const pageRows = useMemo(
    () => liste.slice((page - 1) * pageSize, page * pageSize),
    [liste, page, pageSize]
  );
  return { page, setPage, totalPages, pageSize, total: liste.length, pageRows, offset: (page - 1) * pageSize };
};

export default Pagination;
