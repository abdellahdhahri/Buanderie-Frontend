import React, { useState } from 'react';
import { LayoutGrid, Table2 } from 'lucide-react';
import { tk } from './i18n';

export const Tabs = ({ items, value, onChange }) => (
  <div className="kit-tabs" role="tablist">
    {items.map((it) => (
      <button
        key={it.value}
        type="button"
        role="tab"
        aria-selected={value === it.value}
        className={`kit-tab ${value === it.value ? 'is-active' : ''}`}
        onClick={() => onChange(it.value)}
      >
        {it.icon && <span className="kit-tab__icon">{it.icon}</span>}
        {it.label}
        {it.count !== undefined && <span className="kit-tab__count">{it.count}</span>}
      </button>
    ))}
  </div>
);

export const StatChips = ({ items }) => (
  <div className="kit-chips">
    {items.filter(Boolean).map((it) => (
      <span key={it.label} className={`kit-chip kit-chip--${it.tone || 'default'}`} title={it.title}>
        {it.icon}
        <strong>{it.value}</strong> {it.label}
      </span>
    ))}
  </div>
);

export const RowActions = ({ children }) => (
  <div className="kit-row-actions" onClick={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}>
    {children}
  </div>
);

export const RowButton = ({ icon: Icon, title, onClick, tone, disabled = false }) => (
  <button
    type="button"
    className={`kit-row-btn ${tone ? `kit-row-btn--${tone}` : ''}`}
    title={title}
    aria-label={title}
    disabled={disabled}
    onClick={onClick}
  >
    {Icon && (React.isValidElement(Icon) ? Icon : <Icon size={16} />)}
  </button>
);

export const FormGrid = ({ children, columns = 2 }) => (
  <div className="kit-form-grid" style={{ '--kit-cols': columns }}>{children}</div>
);

export const Code = ({ children }) => <span className="kit-code">{children || '—'}</span>;

const lireVue = (cle, defaut) => {
  try { return localStorage.getItem(`vue.${cle}`) || defaut; } catch { return defaut; }
};

export function useVue(cle, defaut = 'interactif') {
  const [vue, setVue] = useState(() => lireVue(cle, defaut));
  const changer = (v) => {
    setVue(v);
    try { localStorage.setItem(`vue.${cle}`, v); } catch { return; }
  };
  return [vue, changer];
}

export const VueSwitch = ({ value, onChange, compact = false }) => {
  const options = [
    { value: 'interactif', label: tk('viewInteractive', 'Interactif'), Icon: LayoutGrid },
    { value: 'tableau', label: tk('viewTable', 'Tableau'), Icon: Table2 },
  ];
  return (
    <div className={`kit-vue ${compact ? 'is-compact' : ''}`} role="radiogroup" aria-label={tk('viewMode', "Type d'affichage")}>
      {options.map(({ value: v, label, Icon }) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          title={label}
          className={`kit-vue__btn ${value === v ? 'is-active' : ''}`}
          onClick={() => onChange(v)}
        >
          <Icon size={15} strokeWidth={2} />
          {!compact && <span>{label}</span>}
        </button>
      ))}
    </div>
  );
};
