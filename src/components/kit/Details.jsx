import React, { useEffect } from 'react';
import { ArrowLeft, ChevronRight, FileText, X } from 'lucide-react';
import { getInitials, getAvatarColor } from './helpers';
import { tk } from './i18n';

const TONS = {
  blue: 'teal', teal: 'teal', info: 'sky', sky: 'sky', green: 'green', success: 'green',
  amber: 'amber', warning: 'amber', violet: 'violet', purple: 'violet', danger: 'red', red: 'red', slate: 'slate',
};
const ton = (t) => TONS[t] || 'teal';

const monogramme = (titre) => {
  if (typeof titre !== 'string') return null;
  const mots = titre.replace(/^#\S+\s*[·-]\s*/, '').split(/[\s·\-_/]+/).filter((m) => /[A-Za-zÀ-ÿ0-9]/.test(m));
  if (!mots.length) return null;
  const lettres = mots.length > 1 ? mots[0][0] + mots[1][0] : mots[0].slice(0, 2);
  return lettres.toUpperCase();
};

export const DetailsPage = ({ onBack, backLabel = tk('backToList', 'Retour à la liste'), actions, eyebrow, title, badge, icon, children }) => {
  useEffect(() => {
    if (!onBack) return undefined;
    const surTouche = (e) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      if (document.querySelector('.modal-overlay, [data-modal="true"]')) return;
      const cible = e.target;
      if (cible && /^(INPUT|TEXTAREA|SELECT)$/.test(cible.tagName)) return;
      onBack();
    };
    window.addEventListener('keydown', surTouche);
    return () => window.removeEventListener('keydown', surTouche);
  }, [onBack]);

  const lettres = monogramme(title);

  return (
    <div className="avd-page">
      <nav className="avd-crumbs" aria-label={backLabel}>
        <button type="button" className="avd-back" onClick={onBack} title={`${backLabel} (Échap)`}>
          <ArrowLeft size={15} /> {backLabel}
        </button>
        {eyebrow && (
          <>
            <ChevronRight size={14} className="avd-crumbs__sep" aria-hidden="true" />
            <span className="avd-crumbs__here">{eyebrow}</span>
          </>
        )}
      </nav>

      <header className="avd-hero">
        <span className="avd-hero__mark" aria-hidden="true">
          {icon || lettres || <FileText size={22} />}
        </span>
        <div className="avd-hero__text">
          {eyebrow && <span className="avd-eyebrow">{eyebrow}</span>}
          <div className="avd-hero__title">
            <h2 className="avd-title">{title}</h2>
            {badge}
          </div>
        </div>
        {actions && <div className="avd-topbar-actions">{actions}</div>}
      </header>

      {children}
    </div>
  );
};

export const DetailsButton = ({ variant = 'ghost', icon: Icon, children, ...props }) => (
  <button type="button" className={`avd-btn avd-btn-${variant}`} {...props}>
    {Icon && <Icon size={16} />} {children}
  </button>
);

export const KpiTiles = ({ items }) => (
  <div className={`avd-kpis ${items.length >= 4 ? 'avd-kpis-4' : ''}`}>
    {items.map((k) => (
      <div key={k.label} className={`avd-kpi avd-kpi-${k.tone || 'blue'} avd-tone-${ton(k.tone)}`}>
        <span className="avd-kpi-icon" aria-hidden="true">{k.icon || <i />}</span>
        <div className="avd-kpi-body">
          <span className="avd-kpi-label">{k.label}</span>
          <strong className="avd-kpi-value">{k.value}</strong>
        </div>
      </div>
    ))}
  </div>
);

export const DetailCard = ({ title, icon, actions, children }) => (
  <section className="avd-card">
    {(title || actions) && (
      <header className="avd-card-head">
        {title && <h4 className="avd-card-title">{icon || <i className="avd-card-dot" aria-hidden="true" />}{title}</h4>}
        {actions && <div className="avd-card-actions">{actions}</div>}
      </header>
    )}
    {children}
  </section>
);

export const DetailGrid = ({ children }) => <div className="avd-grid">{children}</div>;

const vide = (v) => v == null || v === '' || (typeof v === 'string' && v.trim() === '');

export const InfoList = ({ items }) => (
  <dl className="avd-dl">
    {items.map((i) => (
      <div key={i.label} className={`${i.wide ? 'is-wide' : ''} ${vide(i.value) ? 'is-empty' : ''}`.trim() || undefined}>
        <dt>{i.label}</dt>
        <dd>{vide(i.value) ? '—' : i.value}</dd>
      </div>
    ))}
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
