import React from 'react';
import { BarChart3, Printer, X } from 'lucide-react';
import { Button } from './Modal';
import { tk } from './i18n';

const StatsModal = ({ open = true, title, subtitle, onPrint, onClose, children }) => {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div className="modal-content kit-modal--lg" onClick={(e) => e.stopPropagation()}>
        <div className="kit-stats-head">
          <div className="kit-stats-head-left">
            <div className="kit-stats-icon"><BarChart3 size={24} /></div>
            <div>
              <h3>{title}</h3>
              {subtitle && <small>{subtitle}</small>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {onPrint && (
              <button type="button" className="kit-stats-print" onClick={onPrint}>
                <Printer size={15} /> {tk('print', 'Imprimer')}
              </button>
            )}
            <button type="button" className="kit-stats-close" onClick={onClose} aria-label={tk('close', 'Fermer')}><X size={18} /></button>
          </div>
        </div>

        {children}

        <div className="modal-actions" style={{ marginTop: 26, justifyContent: 'flex-end', gap: 10 }}>
          <Button variant="secondary" onClick={onClose}>{tk('close', 'Fermer')}</Button>
          {onPrint && (
            <Button icon={<Printer size={16} />} onClick={onPrint}>{tk('printStats', 'Imprimer les statistiques')}</Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsModal;
