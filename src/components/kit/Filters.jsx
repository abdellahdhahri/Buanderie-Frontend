import React from 'react';
import { FileSpreadsheet, ChartPie, RotateCcw, Printer } from 'lucide-react';
import { tk } from './i18n';

export const FilterPanel = ({ children }) => (
  <div className="filter-panel-section">
    <div className="filter-main-layout">{children}</div>
  </div>
);

export const FilterRow = ({ children }) => <div className="filter-row">{children}</div>;

export const FilterField = ({ label, wide = false, children, operator = '=' }) => (
  <div className={`filter-group-item ${wide ? 'wide' : ''}`}>
    <span className="filter-label">{label}</span>
    <div className="filter-input-with-operator">
      {children}
      {operator && <div className="operator-box">{operator}</div>}
    </div>
  </div>
);

export const FilterSelect = ({ label, value, onChange, options = [], allLabel = tk('all', 'Tous'), wide = false }) => (
  <FilterField label={label} wide={wide}>
    <select value={value} onChange={(e) => onChange(e.target.value)} className="filter-select">
      {allLabel && <option value="all">{allLabel}</option>}
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </FilterField>
);

export const FilterText = ({ label, value, onChange, onEnter, placeholder = '' }) => (
  <FilterField label={label}>
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => { if (e.key === 'Enter' && onEnter) onEnter(); }}
      className="filter-input"
    />
  </FilterField>
);

export const FilterDateRange = ({ label = tk('period', 'Période'), from, to, onFrom, onTo }) => (
  <div className="filter-group-item date-range">
    <span className="filter-label">{label}</span>
    <div className="date-inputs-wrapper">
      <input type="date" value={from} onChange={(e) => onFrom(e.target.value)} className="filter-date-input" />
      <input type="date" value={to} onChange={(e) => onTo(e.target.value)} className="filter-date-input" />
    </div>
  </div>
);

export const FilterColumnSelect = ({ value, onChange, columns }) => (
  <FilterSelect
    label={tk('column', 'Colonne')}
    value={value}
    onChange={onChange}
    allLabel={tk('allFields', 'Tous les champs')}
    options={columns.filter((c) => c.searchable && c.visible).map((c) => ({ value: c.key, label: c.label }))}
  />
);

export const SearchButton = ({ onClick, delay = 350 }) => {
  const ref = React.useRef(null);
  const action = React.useRef(onClick);
  action.current = onClick;

  React.useEffect(() => {
    const panel = ref.current?.closest('.filter-panel-section') || ref.current?.parentElement?.parentElement;
    if (!panel) return undefined;
    let timer = null;
    const run = () => { clearTimeout(timer); if (action.current) action.current(); };
    const later = (e) => {
      if (e.target.closest('.vertical-export-stack')) return;
      clearTimeout(timer);
      timer = setTimeout(run, delay);
    };
    const onKey = (e) => { if (e.key === 'Enter' && e.target.matches('input, select')) run(); };
    panel.addEventListener('input', later);
    panel.addEventListener('change', later);
    panel.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(timer);
      panel.removeEventListener('input', later);
      panel.removeEventListener('change', later);
      panel.removeEventListener('keydown', onKey);
    };
  }, [delay]);

  return <span ref={ref} className="kit-autosearch" hidden />;
};

export const ExportStack = ({ onExcel, onStats, onPrint, printTitle = tk('print', 'Imprimer'), onReset, resetTitle = tk('resetFilters', 'Réinitialiser les filtres'), count, onColumns, style, children }) => (
  <div className="vertical-export-stack kit-export-row" style={style}>
    {onReset && (
      <button type="button" className="kit-reset-btn" title={resetTitle} onClick={onReset}>
        <RotateCcw size={16} /> {tk('reset', 'Réinitialiser')}
      </button>
    )}
    {count !== undefined && count !== null && (
      <span className="kit-count-pill">{tk('results', '{{count}} résultat(s)', { count })}</span>
    )}
    {onExcel && (
      <button type="button" className="export-stack-btn excel" title={tk('exportExcel', 'Exporter Excel')} onClick={() => onExcel()}>
        <FileSpreadsheet size={18} />
      </button>
    )}
    {onStats && (
      <button type="button" className="export-stack-btn stats" title={tk('stats', 'Statistiques')} onClick={onStats}>
        <ChartPie size={18} />
      </button>
    )}
    {onPrint && (
      <button type="button" className="export-stack-btn print" title={printTitle} onClick={onPrint}>
        <Printer size={18} />
      </button>
    )}
    {onColumns && <ColumnsButton onClick={onColumns} />}
    {children}
  </div>
);

export const ColumnsButton = ({ onClick, title = tk('columnSettings', 'Paramètres des colonnes') }) => (
  <button type="button" className="export-stack-btn colonnes" title={title} aria-label={title} onClick={onClick}>
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  </button>
);

export const FilterActions = ({ onSearch, onExcel, onStats, onReset, count, onColumns, children }) => (
  <>
    <SearchButton onClick={onSearch} />
    <ExportStack onExcel={onExcel} onStats={onStats} onReset={onReset} count={count} onColumns={onColumns} style={{ marginLeft: '8px' }}>
      {children}
    </ExportStack>
  </>
);
