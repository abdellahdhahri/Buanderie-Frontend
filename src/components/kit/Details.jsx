import React from 'react';
import { ArrowLeft, FileText, X } from 'lucide-react';
import { getInitials, getAvatarColor } from './helpers';
import { tk } from './i18n';

export const DetailsPage = ({ onBack, backLabel = tk('backToList', 'Retour à la liste'), actions, eyebrow, title, badge, children }) => (
  <div className="avd-page">
    <div className="avd-topbar">
      <button type="button" className="avd-back" onClick={onBack}>
        <ArrowLeft size={16} /> {backLabel}
      </button>
      {actions && <div className="avd-topbar-actions">{actions}</div>}
    </div>
    <div className="avd-title-row">
      <div>
        {eyebrow && <span className="avd-eyebrow">{eyebrow}</span>}
        <h2 className="avd-title">{title}</h2>
      </div>
      {badge}
    </div>
    {children}
  </div>
);

export const DetailsButton = ({ variant = 'ghost', icon: Icon, children, ...props }) => (
  <button type="button" className={`avd-btn avd-btn-${variant}`} {...props}>
    {Icon && <Icon size={16} />} {children}
  </button>
);

export const KpiTiles = ({ items }) => (
  <div className={`avd-kpis ${items.length >= 4 ? 'avd-kpis-4' : ''}`}>
    {items.map((k) => (
      <div key={k.label} className={`avd-kpi avd-kpi-${k.tone || 'blue'}`}>
        <span className="avd-kpi-label">{k.label}</span>
        <strong className="avd-kpi-value">{k.value}</strong>
      </div>
    ))}
  </div>
);

export const DetailCard = ({ title, children }) => (
  <div className="avd-card">
    {title && <h4 className="avd-card-title">{title}</h4>}
    {children}
  </div>
);

export const DetailGrid = ({ children }) => <div className="avd-grid">{children}</div>;

export const InfoList = ({ items }) => (
  <dl className="avd-dl">
    {items.map((i) => <div key={i.label}><dt>{i.label}</dt><dd>{i.value ?? '—'}</dd></div>)}
  </dl>
);

export const PersonBlock = ({ id, nom, prenom, name, sub }) => (
  <div className="avd-person">
    <div className="avd-avatar" style={{ background: getAvatarColor(id) }}>{getInitials(nom, prenom)}</div>
    <div>
      <strong className="avd-person-name">{name}</strong>
      {sub && <small className="avd-person-sub">{sub}</small>}
    </div>
  </div>
);

export const Timeline = ({ steps }) => (
  <div className="avd-timeline">
    {steps.map((s, i) => (
      <div key={s.key} className={`avd-step avd-step-${s.status}`}>
        <div className="avd-step-dot">
          {s.status === 'done' || s.status === 'success' ? <FileText size={16} /> : s.status === 'danger' ? <X size={16} /> : <span />}
        </div>
        {i < steps.length - 1 && <div className="avd-step-line" />}
        <div className="avd-step-text"><strong>{s.title}</strong><small>{s.date}</small></div>
      </div>
    ))}
  </div>
);

export const DetailText = ({ children, empty = tk('noInfo', 'Aucune information.') }) => (
  <p className={`avd-text ${children ? '' : 'avd-text-empty'}`}>{children || empty}</p>
);

export const DetailAlert = ({ icon, title, children }) => (
  <div className="avd-alert">
    {icon}
    <div>
      {title && <strong>{title}</strong>}
      {children}
    </div>
  </div>
);
