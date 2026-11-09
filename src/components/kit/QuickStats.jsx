import React from 'react';
import StatsModal from './StatsModal';
import { KpiCard, SectionTitle, DonutChart, LegendeItem, TopBarresList } from '../ui/StatsWidgets';
import { tk } from './i18n';

const COULEURS = ['#0794a4', '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

export const StatsContent = ({ kpis = [], repartitions = [], classements = [] }) => (
  <>
    {kpis.length > 0 && (
      <div className="kit-grid-auto">
        {kpis.map((k, i) => (
          <KpiCard key={k.label} label={k.label} value={k.value} icon={k.icon} color={k.color || COULEURS[i % COULEURS.length]} bg={k.bg} />
        ))}
      </div>
    )}
    {repartitions.map((r) => {
      const items = r.items.filter((it) => it.value > 0).map((it, i) => ({ ...it, color: it.color || COULEURS[i % COULEURS.length] }));
      const total = items.reduce((n, it) => n + it.value, 0);
      return (
        <div key={r.title} style={{ marginBottom: 20 }}>
          <SectionTitle title={r.title} />
          <div className="kit-donut-row">
            <DonutChart data={items} centerLabel={tk('total', 'TOTAL')} centerValue={total} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 220 }}>
              {items.length === 0
                ? <span className="kit-muted">{tk('empty', 'Aucune donnée')}</span>
                : items.map((it) => <LegendeItem key={it.label} color={it.color} label={it.label} value={it.value} total={total} />)}
            </div>
          </div>
        </div>
      );
    })}
    {classements.map((c) => (
      <div key={c.title} className="kit-panel" style={{ marginBottom: 20 }}>
        <SectionTitle title={c.title} />
        <TopBarresList items={c.items} formatValue={c.format} max={c.max || 6} />
      </div>
    ))}
  </>
);

export const QuickStats = ({ open = true, title, subtitle, onClose, ...content }) => {
  if (!open) return null;
  return (
    <StatsModal open title={title} subtitle={subtitle} onClose={onClose}>
      <StatsContent {...content} />
    </StatsModal>
  );
};
