import React from 'react';
import './Fiche.css';

const Champ = ({ label, value, hint, icon, color, pct, highlight, mono, full, onClick, title }) => {
  const contenu = (
    <>
      <span className="kit-fiche__value-main">
        {icon && <span className="kit-fiche__value-icon" aria-hidden="true">{icon}</span>}
        <span className={`kit-fiche__value-text ${mono ? 'is-mono' : ''}`}>{value ?? '—'}</span>
        {hint && <small>{hint}</small>}
      </span>
      {pct != null && (
        <span className="kit-fiche__gauge" aria-hidden="true"><i style={{ width: `${Math.min(Math.max(pct, 0), 100)}%` }} /></span>
      )}
    </>
  );
  return (
    <div className={`kit-fiche__field ${full ? 'is-full' : ''}`} style={color ? { '--c': color } : undefined}>
      <dt>{label}</dt>
      <dd>
        {onClick ? (
          <button type="button" className={`kit-fiche__value is-action ${highlight ? 'is-highlight' : ''}`} onClick={onClick} title={title}>
            {contenu}
          </button>
        ) : (
          <div className={`kit-fiche__value ${highlight ? 'is-highlight' : ''}`}>{contenu}</div>
        )}
      </dd>
    </div>
  );
};

export const FicheResume = ({
  avatar, nom, fonction, statut, statutTone = 'default', infos = [], actions,
  titre, tag, champs = [], colonnes = 2, accent, children, className = '',
}) => (
  <div className={`kit-fiche ${className}`.trim()} style={accent ? { '--fiche': accent } : undefined}>
    <aside className="kit-fiche__side">
      <div className="kit-fiche__profil">
        {avatar && <div className="kit-fiche__avatar" aria-hidden="true">{avatar}</div>}
        <h2 className="kit-fiche__nom">{nom}</h2>
        {fonction && <p className="kit-fiche__fonction">{fonction}</p>}
        {statut && <span className={`kit-fiche__statut kit-fiche__statut--${statutTone}`}>{statut}</span>}
      </div>
      {infos.filter(Boolean).length > 0 && (
        <ul className="kit-fiche__infos">
          {infos.filter(Boolean).map((it) => (
            <li key={it.label}>
              <span className="kit-fiche__info-icon" aria-hidden="true">{it.icon}</span>
              <div>
                <span className="kit-fiche__info-label">{it.label}</span>
                <span className="kit-fiche__info-value">{it.value ?? '—'}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
      {actions && <div className="kit-fiche__actions">{actions}</div>}
    </aside>
    <section className="kit-fiche__main" aria-label={typeof titre === 'string' ? titre : undefined}>
      {(titre || tag) && (
        <header className="kit-fiche__head">
          <h3>{titre}</h3>
          {tag && <span className="kit-fiche__tag">{tag}</span>}
        </header>
      )}
      {champs.filter(Boolean).length > 0 && (
        <dl className="kit-fiche__grid" style={{ '--cols': colonnes }}>
          {champs.filter(Boolean).map((c) => <Champ key={c.key || c.label} {...c} />)}
        </dl>
      )}
      {children}
    </section>
  </div>
);

export const FicheBouton = ({ variant = 'primary', icon, children, className = '', type = 'button', ...props }) => (
  <button type={type} className={`kit-fiche__btn kit-fiche__btn--${variant} ${className}`.trim()} {...props}>
    {icon}{children}
  </button>
);
