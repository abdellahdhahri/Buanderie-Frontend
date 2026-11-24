import React, { useEffect, useMemo, useState } from 'react';
import { Pagination } from './TablePagination';

const normaliser = (v) => String(v ?? '')
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .toLowerCase()
  .trim();

const versDate = (v) => {
  if (v instanceof Date) return v.getTime();
  const s = String(v ?? '').trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0)).getTime();
  m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1], +(m[4] || 0), +(m[5] || 0)).getTime();
  return null;
};

const comparer = (a, b, type) => {
  const vide = (x) => x === null || x === undefined || x === '' || x === '-' || x === '—';
  if (vide(a) && vide(b)) return 0;
  if (vide(a)) return 1;
  if (vide(b)) return -1;
  if (type === 'number') return (Number(a) || 0) - (Number(b) || 0);
  if (type === 'date') return (versDate(a) ?? 0) - (versDate(b) ?? 0);
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  const da = versDate(a);
  const db = versDate(b);
  if (da !== null && db !== null) return da - db;
  return String(a).localeCompare(String(b), 'fr', { numeric: true, sensitivity: 'base' });
};

export const useTableControls = (items, {
  columns = [],
  initialSort = null,
  search: searchExterne,
  onSearchChange,
  searchApplied = false,
  pageSize: pageSizeInitial = 10,
} = {}) => {
  const [searchInterne, setSearchInterne] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(pageSizeInitial);
  const [sort, setSortState] = useState(initialSort);
  const [filters, setFilters] = useState({});

  const search = searchExterne !== undefined ? searchExterne : searchInterne;
  const setSearch = onSearchChange || setSearchInterne;
  const liste = Array.isArray(items) ? items : [];
  const colonne = (key) => columns.find((c) => c.key === key);
  const lire = (col, row) => (col.value ? col.value(row) : row?.[col.key]);

  const filterOptions = (key) => {
    const col = colonne(key);
    if (!col) return [];
    const vues = new Map();
    liste.forEach((r) => {
      const v = lire(col, r);
      if (v === null || v === undefined || v === '') return;
      const cle = String(v);
      if (!vues.has(cle)) vues.set(cle, col.format ? col.format(v) : cle);
    });
    return [...vues.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => comparer(a.value, b.value, col.type));
  };

  const rows = useMemo(() => {
    const terme = searchApplied ? '' : normaliser(search);
    const mots = terme ? terme.split(/\s+/).filter(Boolean) : [];
    const colsRecherche = columns.filter((c) => c.searchable !== false);
    let res = liste.filter((r) => {
      for (const [key, val] of Object.entries(filters)) {
        if (val === '' || val === undefined || val === null) continue;
        const col = colonne(key);
        if (col && String(lire(col, r) ?? '') !== String(val)) return false;
      }
      if (mots.length === 0) return true;
      const texte = normaliser(colsRecherche.map((c) => {
        const v = lire(c, r);
        return c.format && v !== null && v !== undefined ? `${v} ${c.format(v)}` : v;
      }).join(' '));
      return mots.every((m) => texte.includes(m));
    });
    if (sort?.key) {
      const col = colonne(sort.key);
      if (col) {
        const sens = sort.dir === 'desc' ? -1 : 1;
        res = [...res].sort((a, b) => sens * comparer(lire(col, a), lire(col, b), col.type));
      }
    }
    return res;
  }, [liste, search, filters, sort, columns, searchApplied]);

  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(rows.length / pageSize)) : 1;
  const cleCriteres = JSON.stringify([search, filters, sort, pageSize]);
  useEffect(() => { setPage(1); }, [cleCriteres]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);
  const pageRows = useMemo(
    () => (pageSize > 0 ? rows.slice((page - 1) * pageSize, page * pageSize) : rows),
    [rows, page, pageSize]
  );

  const toggleSort = (key) => setSortState((prev) => {
    if (!prev || prev.key !== key) return { key, dir: 'asc' };
    if (prev.dir === 'asc') return { key, dir: 'desc' };
    return initialSort && initialSort.key !== key ? initialSort : null;
  });

  const setFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));
  const nbFiltres = Object.values(filters).filter((v) => v !== '' && v !== undefined && v !== null).length;
  const isActive = Boolean(normaliser(search)) || nbFiltres > 0;

  const reset = () => {
    setFilters({});
    setSearch('');
    setSortState(initialSort);
  };

  return {
    rows,
    pageRows,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    offset: pageSize > 0 ? (page - 1) * pageSize : 0,
    total: liste.length,
    columns,
    search,
    setSearch,
    sort,
    setSort: setSortState,
    toggleSort,
    filters,
    setFilter,
    filterOptions,
    nbFiltres,
    isActive,
    reset,
  };
};

const IconeRecherche = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

export const TableToolbar = ({
  controls,
  placeholder = 'Rechercher…',
  showSort = true,
  showCount = true,
  countLabel = 'ligne',
  children,
  style,
}) => {
  if (!controls) return null;
  const { columns, search, setSearch, sort, setSort, filters, setFilter, filterOptions, isActive, reset, rows, total } = controls;
  const colsFiltre = columns.filter((c) => c.filter);
  const colsTri = columns.filter((c) => c.sortable !== false);
  return (
    <div className="kit-tc-bar" style={style}>
      <div className="kit-tc-search">
        <IconeRecherche />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={placeholder}
        />
        {search && (
          <button type="button" className="kit-tc-clear" onClick={() => setSearch('')} aria-label="Effacer la recherche">×</button>
        )}
      </div>

      {colsFiltre.map((c) => {
        const options = filterOptions(c.key);
        if (options.length < 2 && !filters[c.key]) return null;
        return (
          <select
            key={c.key}
            className={`kit-tc-select ${filters[c.key] ? 'is-active' : ''}`}
            value={filters[c.key] ?? ''}
            onChange={(e) => setFilter(c.key, e.target.value)}
            title={`Filtrer par ${c.label.toLowerCase()}`}
          >
            <option value="">{c.label} : tous</option>
            {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        );
      })}

      {showSort && colsTri.length > 0 && (
        <div className="kit-tc-sort">
          <select
            className={`kit-tc-select ${sort?.key ? 'is-active' : ''}`}
            value={sort?.key || ''}
            onChange={(e) => setSort(e.target.value ? { key: e.target.value, dir: sort?.dir || 'asc' } : null)}
            title="Trier par"
          >
            <option value="">Trier par…</option>
            {colsTri.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
          <button
            type="button"
            className="kit-tc-dir"
            disabled={!sort?.key}
            onClick={() => setSort({ key: sort.key, dir: sort.dir === 'asc' ? 'desc' : 'asc' })}
            title={sort?.dir === 'desc' ? 'Ordre décroissant' : 'Ordre croissant'}
          >
            {sort?.dir === 'desc' ? '↓' : '↑'}
          </button>
        </div>
      )}

      {children}

      {isActive && (
        <button type="button" className="kit-tc-reset" onClick={reset}>Réinitialiser</button>
      )}

      {showCount && (
        <span className="kit-tc-count">
          <strong>{rows.length}</strong>{rows.length !== total ? ` / ${total}` : ''} {countLabel}{rows.length > 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
};

export const SortableTh = ({ controls, col, children, style, className = '', ...rest }) => {
  const actif = controls?.sort?.key === col;
  const dir = actif ? controls.sort.dir : null;
  return (
    <th
      {...rest}
      className={`kit-tc-th ${actif ? 'is-sorted' : ''} ${className}`.trim()}
      style={{ cursor: 'pointer', userSelect: 'none', ...style }}
      onClick={() => controls?.toggleSort(col)}
      title="Cliquer pour trier"
      aria-sort={dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : 'none'}
    >
      <span className="kit-tc-th-inner">
        {children}
        <span className="kit-tc-arrow" aria-hidden="true">{dir === 'asc' ? '▲' : dir === 'desc' ? '▼' : '↕'}</span>
      </span>
    </th>
  );
};

export const AucunResultat = ({ controls, colSpan }) => {
  const contenu = (
    <div className="kit-tc-empty">
      Aucun résultat ne correspond à la recherche ou aux filtres.
      {controls?.isActive && (
        <button type="button" className="kit-tc-reset" onClick={controls.reset}>Réinitialiser</button>
      )}
    </div>
  );
  return colSpan ? <tr><td colSpan={colSpan}>{contenu}</td></tr> : contenu;
};

export const TablePagination = ({ controls, unit = 'ligne(s)', tailles = [10, 25, 50, 100], style }) => {
  if (!controls || controls.pageSize <= 0 || controls.rows.length === 0) return null;
  const { rows, page, setPage, pageSize, setPageSize, totalPages } = controls;
  return (
    <div className="kit-tc-pagination" style={style}>
      <Pagination total={rows.length} page={page} totalPages={totalPages} pageSize={pageSize} onPage={setPage} unit={unit} />
      <label className="kit-tc-pagesize">
        Lignes / page
        <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
          {tailles.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </label>
    </div>
  );
};
