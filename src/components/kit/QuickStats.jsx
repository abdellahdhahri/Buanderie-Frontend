import React from 'react';
import { Hash, CheckCircle2, TrendingUp, Layers, Activity, Gauge, PieChart, Trophy, Sparkles } from 'lucide-react';
import StatsModal from './StatsModal';
import { KpiCard, SectionTitle, DonutChart, LegendeItem, TopBarresList, TopPersonnelList, DetailRow } from '../ui/StatsWidgets';
import { tk } from './i18n';

const COULEURS = ['#0794a4', '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];
const ICONES = [Hash, CheckCircle2, TrendingUp, Layers, Activity, Gauge];

const teinte = (hex) => (/^#[0-9a-f]{6}$/i.test(hex || '') ? `${hex}1a` : '#e9f8fa');
const pct = (v, total) => (total > 0 ? (v / total) * 100 : 0);
const echapper = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const preparer = ({ kpis = [], repartitions = [], classements = [], details = [] }) => {
  const kp = kpis.map((k, i) => {
    const color = k.color || COULEURS[i % COULEURS.length];
    return { ...k, color, bg: k.bg || teinte(color) };
  });
  const rep = repartitions.map((r) => {
    const items = r.items.filter((it) => it.value > 0).map((it, i) => ({ ...it, color: it.color || COULEURS[i % COULEURS.length] }));
    return { ...r, items, total: items.reduce((n, it) => n + it.value, 0) };
  });
  const cls = classements.map((c) => {
    const items = (c.items || []).filter((it) => it.value > 0).sort((a, b) => b.value - a.value);
    const total = items.reduce((n, it) => n + it.value, 0);
    return { ...c, total, items: items.map((it) => ({ ...it, percent: pct(it.value, total) })) };
  });
  const auto = [
    ...rep.filter((r) => r.items.length > 1).map((r) => {
      const top = [...r.items].sort((a, b) => b.value - a.value)[0];
      return { label: `${r.title} · ${tk('dominant', 'dominant')}`, value: top.label, subtitle: `${top.value} · ${pct(top.value, r.total).toFixed(1)}%` };
    }),
    ...cls.filter((c) => c.items.length > 0).map((c) => ({
      label: `${c.title} · ${tk('leader', 'en tête')}`,
      value: c.items[0].label,
      subtitle: `${c.format ? c.format(c.items[0].value) : c.items[0].value} · ${c.items[0].percent.toFixed(1)}%`,
      highlight: true,
    })),
  ];
  return { kp, rep, cls, faits: [...details, ...auto] };
};

export const StatsContent = (props) => {
  const { kp, rep, cls, faits } = preparer(props);
  return (
    <>
      {kp.length > 0 && (
        <div className="kit-grid-auto">
          {kp.map((k, i) => {
            const Icone = ICONES[i % ICONES.length];
            return <KpiCard key={k.label} label={k.label} value={k.value} icon={k.icon || <Icone size={18} />} color={k.color} bg={k.bg} />;
          })}
        </div>
      )}

      {rep.map((r) => (
        <div key={r.title}>
          <SectionTitle icon={<PieChart size={16} />} title={`${tk('breakdownBy', 'Répartition')} · ${r.title}`} />
          <div className="kit-donut-row">
            <DonutChart data={r.items} size={200} thickness={32} centerLabel={r.centerLabel || tk('total', 'TOTAL')} centerValue={r.total} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 220 }}>
              {r.items.length === 0
                ? <span className="kit-muted">{tk('empty', 'Aucune donnée')}</span>
                : r.items.map((it) => <LegendeItem key={it.label} color={it.color} label={it.label} value={it.value} total={r.total} />)}
            </div>
          </div>
        </div>
      ))}

      {cls.length > 0 && (
        <div className="kit-stats-top">
          {cls.map((c) => (
            <div key={c.title} className="kit-panel">
              <SectionTitle icon={<Trophy size={16} />} title={`${tk('top', 'Top')} · ${c.title}`} inline />
              {c.personnel
                ? <TopPersonnelList items={c.items.slice(0, c.max || 3)} formatValue={c.format} percentLabel={c.percentLabel || tk('ofTotal', 'du total')} />
                : <TopBarresList items={c.items} formatValue={c.format} max={c.max || 6} />}
            </div>
          ))}
        </div>
      )}

      {faits.length > 0 && (
        <>
          <SectionTitle icon={<Sparkles size={16} />} title={tk('highlights', 'Faits marquants')} />
          <div className="kit-stats-facts">
            {faits.map((d) => <DetailRow key={d.label} label={d.label} value={d.value} subtitle={d.subtitle} highlight={d.highlight} subtitleIcon={<Activity size={13} />} />)}
          </div>
        </>
      )}
    </>
  );
};

export const imprimerStats = ({ title, subtitle, ...contenu }) => {
  const w = window.open('', '_blank', 'width=900,height=800');
  if (!w) return;
  const { kp, rep, cls, faits } = preparer(contenu);
  const date = new Date().toLocaleString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const kpiHtml = kp.map((k) => `<div class="kpi" style="border-left-color:${k.color}"><span>${echapper(k.label)}</span><strong>${echapper(k.value)}</strong></div>`).join('');
  const repHtml = rep.map((r) => `
    <div class="section-title">${echapper(tk('breakdownBy', 'Répartition'))} · ${echapper(r.title)}</div>
    <div class="cards">${r.items.map((it) => `<div class="card" style="border-color:${it.color}"><span>${echapper(it.label)}</span><strong style="color:${it.color}">${it.value}</strong><em>${pct(it.value, r.total).toFixed(1)}%</em></div>`).join('')}</div>`).join('');
  const clsHtml = cls.map((c) => `
    <div class="section-title">${echapper(tk('top', 'Top'))} · ${echapper(c.title)}</div>
    <table>${c.items.slice(0, c.max || 10).map((it, i) => `<tr><td class="rank">${i + 1}</td><td>${echapper(it.label)}</td><td class="num">${echapper(c.format ? c.format(it.value) : it.value)}</td><td class="num muted">${it.percent.toFixed(1)}%</td></tr>`).join('')}</table>`).join('');
  const faitsHtml = faits.length ? `<div class="section-title">${echapper(tk('highlights', 'Faits marquants'))}</div><div class="facts">${faits.map((d) => `<div class="fact${d.highlight ? ' hl' : ''}"><span>${echapper(d.label)}</span><strong>${echapper(d.value)}</strong>${d.subtitle ? `<em>${echapper(d.subtitle)}</em>` : ''}</div>`).join('')}</div>` : '';
  w.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>${echapper(title)}</title><style>
    *{box-sizing:border-box}body{font-family:'Segoe UI',-apple-system,sans-serif;margin:0;padding:30px 40px;color:#0f172a}
    .header{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #0794a4;padding-bottom:16px;margin-bottom:24px}
    .brand{display:flex;align-items:center;gap:12px}.brand-icon{width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#0aa8ba,#0794a4);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:900}
    h1{margin:0;font-size:1.5rem;letter-spacing:-.02em}.sub{color:#64748b;font-size:.88rem}.date{color:#64748b;font-size:.85rem;font-weight:600;text-align:right}
    .section-title{font-size:.78rem;font-weight:800;color:#0794a4;text-transform:uppercase;letter-spacing:.08em;margin:26px 0 12px;padding-bottom:6px;border-bottom:2px solid #e2e8f0}
    .kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px}.kpi{border:1px solid #e2e8f0;border-left:4px solid;border-radius:10px;padding:12px 14px;display:flex;flex-direction:column;gap:4px}
    .kpi span{font-size:.7rem;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#64748b}.kpi strong{font-size:1.4rem}
    .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}.card{border:2px solid;border-radius:10px;padding:10px 12px;display:flex;flex-direction:column;gap:2px}
    .card span{font-size:.75rem;font-weight:700;color:#475569}.card strong{font-size:1.3rem}.card em{font-style:normal;font-size:.75rem;color:#64748b}
    table{width:100%;border-collapse:collapse}td{padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:.88rem}.rank{width:36px;text-align:center;font-weight:800;color:#0794a4}.num{text-align:right;font-weight:700}.muted{color:#64748b;font-weight:600}
    .facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}.fact{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:10px 12px;display:flex;flex-direction:column;gap:2px}.fact.hl{background:#f0fdfa;border-color:#99f6e4}
    .fact span{font-size:.72rem;font-weight:700;color:#64748b}.fact strong{font-size:1rem}.fact em{font-style:normal;font-size:.75rem;color:#64748b}
    .foot{margin-top:36px;padding-top:12px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:.75rem;text-align:center}
    @media print{body{padding:16px 20px}}
  </style></head><body>
    <div class="header"><div class="brand"><div class="brand-icon">B</div><div><h1>${echapper(title)}</h1>${subtitle ? `<div class="sub">${echapper(subtitle)}</div>` : ''}</div></div><div class="date">${echapper(tk('printedOn', 'Imprimé le'))}<br>${echapper(date)}</div></div>
    ${kpiHtml ? `<div class="section-title">${echapper(tk('keyFigures', 'Chiffres clés'))}</div><div class="kpis">${kpiHtml}</div>` : ''}
    ${repHtml}${clsHtml}${faitsHtml}
    <div class="foot">${echapper(title)} · ${echapper(date)}</div>
    <script>window.onload=()=>{window.print();}</script>
  </body></html>`);
  w.document.close();
};

export const QuickStats = ({ open = true, title, subtitle, onClose, printable = true, ...content }) => {
  if (!open) return null;
  return (
    <StatsModal open title={title} subtitle={subtitle} onClose={onClose} onPrint={printable ? () => imprimerStats({ title, subtitle, ...content }) : undefined}>
      <StatsContent {...content} />
    </StatsModal>
  );
};
