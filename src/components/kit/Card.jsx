import React, { useState } from 'react';

const renderIcon = (Icon, size = 18) => {
  if (!Icon) return null;
  if (React.isValidElement(Icon)) return Icon;
  return <Icon size={size} />;
};

export const Card = ({
  as: Tag = 'div',
  id,
  title,
  titre,
  subtitle,
  icon,
  badge,
  actions,
  footer,
  open = true,
  collapsible = false,
  defaultExpanded = true,
  variant = 'default',
  padding = 'md',
  className = '',
  bodyClassName = '',
  headerClassName = '',
  style,
  children,
  ...rest
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const displayTitle = title ?? titre;
  const hasHeader = Boolean(displayTitle || subtitle || icon || badge || actions || collapsible);

  if (!open) {
    return null;
  }

  return (
    <Tag
      id={id}
      className={`kit-card kit-card--${variant} kit-card--pad-${padding} ${className}`.trim()}
      style={style}
      {...rest}
    >
      {hasHeader && (
        <div
          className={`kit-card__header ${collapsible ? 'is-collapsible' : ''} ${headerClassName}`.trim()}
          onClick={collapsible ? () => setExpanded((e) => !e) : undefined}
          role={collapsible ? 'button' : undefined}
          tabIndex={collapsible ? 0 : undefined}
          aria-expanded={collapsible ? expanded : undefined}
        >
          <div className="kit-card__header-main">
            {icon && <span className="kit-card__icon">{renderIcon(icon, 18)}</span>}
            <div className="kit-card__titles">
              {displayTitle && (
                <div className="kit-card__title-row">
                  <span className="kit-card__title-pill">{displayTitle}</span>
                  {badge && <span className="kit-card__badge">{badge}</span>}
                  <span className="kit-card__title-line" />
                </div>
              )}
              {subtitle && <p className="kit-card__subtitle">{subtitle}</p>}
            </div>
          </div>

          {(actions || collapsible) && (
            <div className="kit-card__actions" onClick={(e) => e.stopPropagation()}>
              {actions}
              {collapsible && (
                <button
                  type="button"
                  className={`kit-card__collapse-btn ${expanded ? 'is-open' : ''}`}
                  onClick={() => setExpanded((e) => !e)}
                  aria-label={expanded ? 'Réduire' : 'Développer'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {(!collapsible || expanded) && (
        <div className={`kit-card__body ${bodyClassName}`.trim()}>
          {children}
        </div>
      )}

      {footer && (!collapsible || expanded) && (
        <div className="kit-card__footer">
          {footer}
        </div>
      )}
    </Tag>
  );
};

export const SectionCard = ({
  id,
  prefix = 'fe',
  open = true,
  titre,
  title,
  badge,
  icon,
  actions,
  className = '',
  bodyClassName = '',
  children,
}) => {
  const displayTitle = title ?? titre;
  return (
    <section
      id={id ? `${prefix}-${id}` : undefined}
      className={`aje-card fe2-card aje-card--onglet kit-section-card ${className}`.trim()}
      hidden={!open}
    >
      <div className={`aje-card__body fe-section-content-inner kit-card__surface ${bodyClassName}`.trim()}>
        {(displayTitle || actions) && (
          <div className="fe-subsection-title fe-groupe-titre kit-card__group-head">
            {displayTitle && (
              <span className="fe-subsection-label kit-card__title-pill">
                {icon && <span className="kit-card__pill-icon">{renderIcon(icon, 15)}</span>}
                {displayTitle}
              </span>
            )}
            {badge && <span className="fe-subsection-year kit-card__badge">{badge}</span>}
            <span className="fe-subsection-line kit-card__title-line" />
            {actions && <div className="kit-card__actions">{actions}</div>}
          </div>
        )}
        {children}
      </div>
    </section>
  );
};

export default Card;

