import React from 'react';
import { tk } from './i18n';

export const Modal = ({
  open = true, title, subtitle, icon, tone = 'default', size = 'sm', onClose, closeOnOverlay = true,
  footer, headerActions, zIndex, className = '', children,
}) => {
  if (!open) return null;
  return (
    <div className="modal-overlay" style={zIndex ? { zIndex } : undefined} onClick={closeOnOverlay && onClose ? onClose : undefined}>
      <div className={`modal-content kit-modal kit-modal--${size} ${className}`.trim()} onClick={(e) => e.stopPropagation()}>
        {(title || headerActions) && (
          <div className={`kit-modal-header kit-modal-header--${tone}`}>
            <div className="kit-modal-header-left">
              {icon && <span className="kit-modal-header-icon">{icon}</span>}
              <div className="kit-modal-head-text">
                {title && <h2 className="kit-modal-title">{title}</h2>}
                {subtitle && <div className="kit-modal-subtitle">{subtitle}</div>}
              </div>
            </div>
            <div className="kit-modal-head-actions">
              {headerActions}
              {onClose && (
                <button type="button" className="kit-modal-close" onClick={onClose} aria-label={tk('close', 'Fermer')} title={tk('close', 'Fermer')}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}
        <div className="kit-modal-scroll">{children}</div>
        {footer && <div className="modal-actions kit-modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

export const Button = ({ variant = 'primary', icon, children, className = '', type = 'button', ...props }) => {
  const base = variant === 'secondary' ? 'btn-secondary' : 'btn-primary';
  const extra = variant === 'danger' ? 'kit-btn--danger' : variant === 'success' ? 'kit-btn--success' : '';
  return (
    <button type={type} className={`${base} ${extra} ${icon ? 'kit-btn-icon' : ''} ${className}`} {...props}>
      {icon}{children}
    </button>
  );
};

export const FormField = ({ label, required = false, error, hint, span = false, children }) => (
  <div className={`form-group ${span ? 'kit-span' : ''}`.trim()}>
    {label && <label>{label}{required && <span className="kit-required">*</span>}</label>}
    {children}
    {hint && <small className="kit-hint">{hint}</small>}
    {error && <small className="kit-field-error">{error}</small>}
  </div>
);

export const TextArea = ({ value, onChange, rows = 3, ...props }) => (
  <textarea className="kit-textarea" rows={rows} value={value} onChange={(e) => onChange(e.target.value)} {...props} />
);

export const ModalSummary = ({ children }) => <div className="kit-modal-summary">{children}</div>;

export const ConfirmDialog = ({ open = true, title = tk('confirmation', 'Confirmation'), message, details, confirmLabel = tk('confirm', 'Confirmer'), cancelLabel = tk('cancel', 'Annuler'), tone = 'danger', busy = false, onConfirm, onClose }) => (
  <Modal
    open={open}
    title={title}
    tone={tone}
    onClose={busy ? undefined : onClose}
    footer={(
      <>
        <Button variant="secondary" onClick={onClose} disabled={busy}>{cancelLabel}</Button>
        <Button variant={tone === 'danger' ? 'danger' : tone === 'success' ? 'success' : 'primary'} onClick={onConfirm} disabled={busy}>
          {confirmLabel}
        </Button>
      </>
    )}
  >
    {message && <p>{message}</p>}
    {details && <div style={{ marginTop: 12, padding: 12, background: '#f8fafc', borderRadius: 8 }}>{details}</div>}
  </Modal>
);

export const MotifDialog = ({ open = true, title, summary, label = tk('reason', 'Motif'), value, onChange, confirmLabel = tk('confirm', 'Confirmer'), busyLabel = tk('saving', 'Enregistrement…'), tone = 'danger', busy = false, error, onConfirm, onClose }) => (
  <Modal
    open={open}
    title={title}
    tone={tone}
    onClose={busy ? undefined : onClose}
    footer={(
      <>
        <Button variant="secondary" onClick={onClose} disabled={busy}>{tk('back', 'Retour')}</Button>
        <Button variant={tone === 'danger' ? 'danger' : 'success'} onClick={onConfirm} disabled={busy || !String(value || '').trim()}>
          {busy ? busyLabel : confirmLabel}
        </Button>
      </>
    )}
  >
    {summary && <ModalSummary>{summary}</ModalSummary>}
    <FormField label={label} required>
      <TextArea value={value} onChange={onChange} autoFocus />
    </FormField>
    {error && <small className="kit-field-error">{error}</small>}
  </Modal>
);
