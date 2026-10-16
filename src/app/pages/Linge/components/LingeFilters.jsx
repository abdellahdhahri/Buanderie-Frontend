import React from "react";
import { useTranslation } from "react-i18next";
import { Search, FilterX, BarChart3, FileSpreadsheet, Loader2, X } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { CATEGORIES } from "../../../contextes/LingeContext";
import { ETAT_OPTIONS } from "../lingeConstants";

// Bouton icône de la colonne d'actions, avec infobulle à gauche
function RailButton({ icon: Icon, label, color, onClick, disabled, busy, badge }) {
  return (
    <div className="relative group">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || busy}
        aria-label={label}
        className="relative w-9 h-9 rounded-[11px] flex items-center justify-center border bg-white transition-all hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(15,23,42,0.08)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
        style={{ color, borderColor: `${color}40` }}
        onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = `${color}0f`; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}
      >
        {busy ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : <Icon className="w-[18px] h-[18px]" strokeWidth={2.1} />}
        {badge > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-white"
            style={{ background: color }}>
            {badge}
          </span>
        )}
      </button>
      <span role="tooltip"
        className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-focus-within:opacity-100 transition-all shadow-lg z-20">
        {label}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 🔎 FILTRES + actions (effacer, statistiques, export Excel)
// ═══════════════════════════════════════════════════════════════════════════
export function LingeFilters({ filters, onChange, services, onReset, onStats, onExport, exporting }) {
  const { t } = useTranslation();
  const activeCount = ["etat", "categorie", "serviceId", "search"].filter((k) => filters[k]).length;
  const selectCls = "w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <Card className="mb-6">
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
          {/* Champs */}
          <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 content-center">
            <div>
              <label className="block text-sm font-medium mb-2">{t('linge.status')}</label>
              <select value={filters.etat} onChange={(e) => onChange({ ...filters, etat: e.target.value })} className={selectCls}>
                <option value="">{t('common.all')}</option>
                {ETAT_OPTIONS.map((etat) => (
                  <option key={etat} value={etat}>{t(`linge_etat.${etat}`)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('linge.category')}</label>
              <select value={filters.categorie} onChange={(e) => onChange({ ...filters, categorie: e.target.value })} className={selectCls}>
                <option value="">{t('common.all')}</option>
                {CATEGORIES.map((cat, i) => (
                  <option key={i} value={cat}>{t(`categories.${cat}`, cat)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('linge.service')}</label>
              <select value={filters.serviceId} onChange={(e) => onChange({ ...filters, serviceId: e.target.value })} className={selectCls}>
                <option value="">{t('common.all')}</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>{s.code}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('common.search')}</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={t('linge.search_placeholder')}
                  value={filters.search}
                  onChange={(e) => onChange({ ...filters, search: e.target.value })}
                  className="w-full h-10 pl-10 pr-9 rounded-lg border border-input bg-input-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {filters.search && (
                  <button type="button" onClick={() => onChange({ ...filters, search: "" })}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    aria-label={t('common.clear', 'Effacer')}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Colonne d'actions (verticale) */}
          <div className="flex sm:flex-col items-center justify-center gap-2 sm:pl-5 sm:border-l border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
            <RailButton icon={FilterX} color="#e67700" onClick={onReset} disabled={!activeCount} badge={activeCount}
              label={t('linge.filters.clear', 'Supprimer les filtres')} />
            <RailButton icon={BarChart3} color="#0d9488" onClick={onStats}
              label={t('linge.filters.stats', 'Afficher les statistiques')} />
            <RailButton icon={FileSpreadsheet} color="#16a34a" onClick={onExport} busy={exporting}
              label={t('linge.filters.export', 'Exporter en Excel')} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
