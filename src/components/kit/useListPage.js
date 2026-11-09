import { useEffect, useMemo, useState } from 'react';

const useListPage = ({ rows, columns, getSearchValue, getSortValue, defaultSort, filters = {}, pageSize = 10 }) => {
  const initialFilters = useMemo(
    () => Object.fromEntries(Object.entries(filters).map(([k, f]) => [k, f.initial ?? 'all'])),
    []
  );
  const VIDE = { searchTerm: '', searchColumn: 'all', ...initialFilters };

  const [draft, setDraft] = useState(VIDE);
  const [applied, setApplied] = useState(VIDE);
  const [columnSettings, setColumnSettings] = useState(columns);
  const [sort, setSort] = useState({ key: null, direction: 'asc' });
  const [page, setPage] = useState(1);

  useEffect(() => {
    setColumnSettings((prev) => {
      let changed = false;
      const next = prev.map((c) => {
        const label = columns.find((x) => x.key === c.key)?.label;
        if (label === undefined || label === c.label) return c;
        changed = true;
        return { ...c, label };
      });
      return changed ? next : prev;
    });
  }, [columns]);

  const isColVisible = (key) => {
    const col = columnSettings.find((c) => c.key === key);
    return col ? col.visible : true;
  };

  const setFilter = (name, value) => setDraft((d) => ({ ...d, [name]: value }));
  const apply = () => setApplied(draft);
  const reset = () => { setDraft(VIDE); setApplied(VIDE); };

  const toggleColumnVisibility = (key) => {
    const current = columnSettings.find((c) => c.key === key);
    const willBeHidden = current ? current.visible === true : false;
    setColumnSettings((prev) => prev.map((c) => (c.key === key ? { ...c, visible: !c.visible } : c)));
    if (willBeHidden) {
      Object.entries(filters).forEach(([name, f]) => {
        if (f.column === key) setFilter(name, f.initial ?? 'all');
      });
    }
  };
  const toggleColumnSearchability = (key) => {
    setColumnSettings((prev) => prev.map((c) => (c.key === key ? { ...c, searchable: !c.searchable } : c)));
    setDraft((d) => (d.searchColumn === key ? { ...d, searchColumn: 'all' } : d));
  };

  const filtered = useMemo(() => {
    const searchable = columnSettings.filter((c) => c.searchable).map((c) => c.key);
    const term = (applied.searchTerm || '').toLowerCase().trim();
    const contient = (row, key) => {
      const v = getSearchValue(row, key);
      return v && String(v).toLowerCase().includes(term);
    };
    return rows.filter((row) => {
      if (term) {
        const ok = applied.searchColumn === 'all' ? searchable.some((k) => contient(row, k)) : contient(row, applied.searchColumn);
        if (!ok) return false;
      }
      return Object.entries(filters).every(([name, f]) => {
        if (f.column && !isColVisible(f.column)) return true;
        return f.test(row, applied[name], applied);
      });
    });
  }, [rows, applied, columnSettings]);

  const sorted = useMemo(() => {
    if (!sort.key) return defaultSort ? [...filtered].sort(defaultSort) : filtered;
    const dir = sort.direction === 'desc' ? -1 : 1;
    return [...filtered].sort((a, b) => {
      const va = getSortValue(a, sort.key);
      const vb = getSortValue(b, sort.key);
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
      return String(va).localeCompare(String(vb), 'fr', { numeric: true, sensitivity: 'base' }) * dir;
    });
  }, [filtered, sort]);

  const toggleSort = (key) => setSort((prev) => {
    if (prev.key !== key) return { key, direction: 'asc' };
    if (prev.direction === 'asc') return { key, direction: 'desc' };
    return { key: null, direction: 'asc' };
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [sorted, currentPage, pageSize]
  );
  useEffect(() => { setPage(1); }, [applied, sort]);

  return {
    draft, applied, setFilter, apply, reset,
    columnSettings, visibleColumns: columnSettings.filter((c) => c.visible), isColVisible,
    toggleColumnVisibility, toggleColumnSearchability,
    filtered, sorted, paginated,
    sort, toggleSort,
    page: currentPage, setPage, totalPages, pageSize,
  };
};

export default useListPage;
