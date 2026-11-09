import React from 'react';
import { tk } from './i18n';

export const Page = ({ children, className = '' }) => (
  <div className={`kit-page ${className}`}>{children}</div>
);

const renderIcon = (Icon, size) => {
  if (!Icon) return null;
  if (React.isValidElement(Icon)) return Icon;
  return <Icon size={size} className="header-icon" />;
};

export const PageHeader = ({
  icon: Icon, title, subtitle, total, totalLabel = tk('total', 'TOTAL'), badge,
  onIconClick, iconTitle = tk('columnSettings', 'Paramètres des colonnes'),
  onBack, backTitle = tk('back', 'Retour'), right, className = '',
}) => (
  <div className={`planning-header-card ${className}`.trim()}>
    <div className="header-left">
      {onBack && (
        <button type="button" className="back-arrow-btn kit-back-btn" onClick={onBack} title={backTitle} aria-label={backTitle}>
          <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
        </button>
      )}
      <div className="header-title-box">
        {Icon && (onIconClick ? (
          <button
            type="button"
            className="settings-toggle-btn"
            onClick={onIconClick}
            title={iconTitle}
            aria-label={iconTitle}
            style={{ width: 40, height: 40, marginLeft: 0 }}
          >
            {renderIcon(Icon, 24)}
          </button>
        ) : renderIcon(Icon, 24))}
        {subtitle ? (
          <div className="page-title-text">
            <h2>{title}</h2>
            <p className="page-subtitle">{subtitle}</p>
          </div>
        ) : <h2>{title}</h2>}
      </div>
    </div>
    <div className="header-right">
      {right}
      {badge !== undefined
        ? <span className="badge-depot">{badge}</span>
        : total !== undefined && <span className="badge-depot">{totalLabel} : {total}</span>}
    </div>
  </div>
);

export const ActionBar = ({ children, className = '' }) => <div className={`actions-bar-card ${className}`.trim()}>{children}</div>;

export const ActionButton = ({ icon: Icon, label, variant = 'details', disabled = false, onClick, title, style }) => (
  <button
    type="button"
    className={`action-bar-btn ${variant} ${disabled ? 'disabled' : ''}`}
    disabled={disabled}
    onClick={disabled ? undefined : onClick}
    title={title || label}
    style={style}
  >
    {Icon && (React.isValidElement(Icon) ? Icon : <Icon size={18} />)}
    <span className="btn-label">{label}</span>
  </button>
);

export const ActionMenu = ({ icon: Icon, label, variant = 'imprimer', items = [], title, disabled = false }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  const list = items.filter(Boolean);

  React.useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const iconOf = (I, size) => (I ? (React.isValidElement(I) ? I : <I size={size} />) : null);

  return (
    <div className="kit-action-menu" ref={ref}>
      <button
        type="button"
        className={`action-bar-btn ${variant} ${open ? 'is-open' : ''} ${disabled ? 'disabled' : ''}`}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        title={title || label}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {iconOf(Icon, 18)}
        <span className="btn-label">{label}</span>
        <svg className="kit-action-menu__chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
      </button>
      {open && (
        <div className="kit-action-menu__list" role="menu">
          {list.map((it, i) => (
            <button
              key={i}
              type="button"
              role="menuitem"
              className="kit-action-menu__item"
              disabled={it.disabled}
              title={it.title}
              onClick={() => { setOpen(false); if (it.onClick) it.onClick(); }}
            >
              <span className="kit-action-menu__icon">{iconOf(it.icon, 16)}</span>
              <span>{it.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
