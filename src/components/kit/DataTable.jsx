import React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { SelectAllCheckbox, RowCheckbox, BulkBar } from '../ui/RowSelection';
import { getPageNumbers, getInitials, getAvatarColor } from './helpers';
import { tk } from './i18n';

export const DataTable = ({
  columns, visible, rows, rowKey = (r) => r.id,
  sort, onSort, selection, activeId,
  onRowClick, onRowDoubleClick, rowClassName, rowProps,
  emptyText = tk('empty', 'Aucune donnée'), emptyContent, emptyCellClassName = '',
  loading = false, loadingText = tk('loading', 'Chargement…'), error = null,
  tableClassName = '', tableBaseClass = 'modern-table', wrapperClassName = 'table-wrapper',
  baseRowClass = 'employee-row', activeRowClass = 'selected', sortableByDefault = false,
}) => {
  const cols = (visible || Object.keys(columns).map((key) => ({ key }))).map((c) => ({ key: c.key, ...(columns[c.key] || {}) })).filter((c) => c.render || c.cell);
  const sortIcon = (key) => {
    if (!sort || sort.key !== key) return <span className="sort-indicator"><ChevronsUpDown size={14} /></span>;
    return (
      <span className="sort-indicator active">
        {sort.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </span>
    );
  };

  return (
    <div className={wrapperClassName}>
      <table className={`${tableBaseClass} ${tableClassName}`.trim()}>
        <thead>
          <tr>
            {selection && <SelectAllCheckbox sel={selection} />}
            {cols.map((c) => {
              if (c.header) return <React.Fragment key={c.key}>{c.header()}</React.Fragment>;
              const sortable = (c.sortable ?? sortableByDefault) && onSort;
              const isSorted = sort?.key === c.key;
              return (
                <th
                  key={c.key}
                  className={`${sortable ? 'sortable-th' : ''} ${c.thClassName || ''}`.trim() || undefined}
                  onClick={sortable ? () => onSort(c.key) : undefined}
                  title={sortable ? tk('clickToSort', 'Cliquer pour trier') : undefined}
                  aria-sort={isSorted ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                  style={c.align || c.thStyle ? { ...(c.align ? { textAlign: c.align } : {}), ...(c.thStyle || {}) } : undefined}
                >
                  <span className="th-content">
                    {c.label}
                    {sortable && sortIcon(c.key)}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr><td colSpan={cols.length + (selection ? 1 : 0)} className="text-center" style={{ padding: 24, color: '#64748b', fontWeight: 600 }}>{loadingText}</td></tr>
          )}
          {!loading && error && (
            <tr><td colSpan={cols.length + (selection ? 1 : 0)} className="text-center" style={{ padding: 24, color: '#ef4444', fontWeight: 600 }}>{error}</td></tr>
          )}
          {!loading && !error && rows.map((r) => {
            const id = rowKey(r);
            return (
              <tr
                key={id}
                {...(rowProps ? rowProps(r) : {})}
                className={`${baseRowClass} ${selection?.isChecked(id) ? 'rs-checked' : ''} ${activeId != null && activeId === id ? activeRowClass : ''} ${rowClassName ? rowClassName(r) : ''}`}
                onClick={onRowClick ? () => onRowClick(r) : undefined}
                onDoubleClick={onRowDoubleClick ? (e) => {
                  if (e.target.closest('input, button, a, select, label')) return;
                  onRowDoubleClick(r, e);
                } : undefined}
              >
                {selection && <RowCheckbox sel={selection} id={id} />}
                {cols.map((c) => (c.cell ? (
                  <React.Fragment key={c.key}>{c.cell(r)}</React.Fragment>
                ) : (
                  <td key={c.key} style={c.align ? { textAlign: c.align } : undefined} {...(c.tdProps ? c.tdProps(r) : {})}>
                    {c.render(r)}
                  </td>
                )))}
              </tr>
            );
          })}
          {!loading && !error && rows.length === 0 && (
            <tr>
              <td colSpan={cols.length + (selection ? 1 : 0)} className={emptyContent ? emptyCellClassName : 'text-center'}>
                {emptyContent || emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export const Pagination = ({ total, page, totalPages, pageSize, onPage, unit = tk('rows', 'ligne(s)') }) => (
  <div className="table-footer-pagination">
    <div className="pagination-left">
      {total} {unit}
      {total > 0
        ? <> — {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} {tk('shown', 'affichée(s)')}</>
        : <> — {tk('page', 'Page')} 1 / 1</>}
    </div>
    <div className="pagination-right">
      <button type="button" className="pag-btn" disabled={page <= 1} onClick={() => onPage(Math.max(1, page - 1))} title={tk('prevPage', 'Page précédente')}>
        <ChevronLeft size={14} />
      </button>
      {getPageNumbers(page, totalPages).map((p, i) => (p === '...' ? (
        <span key={`e-${i}`} className="pag-ellipsis">…</span>
      ) : (
        <button key={p} type="button" className={`pag-btn ${p === page ? 'active' : ''}`} onClick={() => onPage(p)} disabled={totalPages <= 1}>
          {p}
        </button>
      )))}
      <button type="button" className="pag-btn" disabled={page >= totalPages || totalPages <= 1} onClick={() => onPage(Math.min(totalPages, page + 1))} title={tk('nextPage', 'Page suivante')}>
        <ChevronRight size={14} />
      </button>
    </div>
  </div>
);

export const ListSection = ({ selection, bulkActions, unit, units, children }) => (
  <div className="employee-list-section">
    {selection && bulkActions && <BulkBar sel={selection} unit={unit} units={units} actions={bulkActions} />}
    {children}
  </div>
);

export const Badge = ({ variant = 'default', children, title, style }) => (
  <span className={`badge badge-${variant}`} title={title} style={style}>{children}</span>
);

export const PersonName = ({ name, sub, strong = true }) => {
  const texte = String(name || '').trim();
  if (!texte) return <>—</>;
  const mots = texte.split(/\s+/);
  const initiales = ((mots[0]?.[0] || '') + (mots.length > 1 ? mots[mots.length - 1][0] : '')).toUpperCase();
  return (
    <div className="kit-person-cell">
      <span className="kit-avatar">{initiales || '?'}</span>
      <div style={{ minWidth: 0 }}>
        {strong ? <strong style={{ display: 'block' }}>{texte}</strong> : <span style={{ display: 'block' }}>{texte}</span>}
        {sub && <small>{sub}</small>}
      </div>
    </div>
  );
};

export const PersonCell = ({ id, nom, prenom, label, sub }) => (
  <div className="kit-person-cell">
    <span className="kit-avatar" style={{ background: getAvatarColor(id) }}>{getInitials(nom, prenom)}</span>
    <div>
      <strong style={{ display: 'block' }}>{label || `${nom || ''} ${prenom || ''}`.trim()}</strong>
      {sub && <small>{sub}</small>}
    </div>
  </div>
);
