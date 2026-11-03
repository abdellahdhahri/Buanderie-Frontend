import React from "react";
import { LabelIcon } from "../../../components/ui/LabelIcon";
import { SynchroniserButton } from "../../../components/ui/SynchroniserButton";
import { useTranslation } from "react-i18next";
import {
  Plus, Eye, Trash2, Edit, History, RefreshCw, Tag
} from "lucide-react";

const Separator = () => (
  <div style={{ width: "1px", height: "30px", background: "#e2e8f0", margin: "0 8px" }} />
);

// ═══════════════════════════════════════════════════════════════════════════
// 🧰 BARRE D'OUTILS
// ═══════════════════════════════════════════════════════════════════════════
export function LingeToolbar({
  hasSelection,
  isLoading,
  canCreate = true,
  onNew,
  onSynchronised,
  onAssociateRfid,
  onDetail,
  onEdit,
  onDelete,
  onPrintLabel,
  onHistory,
  onRefresh,
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center gap-3 bg-white/65 backdrop-blur-md p-4 rounded-[20px] border border-slate-200/50 shadow-[0_4px_20px_rgba(0,0,0,0.02)] mb-6">
      {canCreate && (
        <button
          onClick={onNew}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#0ca678]/30 rounded-[14px] text-sm font-bold text-[#0ca678] hover:bg-[#0ca678]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" /> {t('linge.new_article')}
        </button>
      )}

      <SynchroniserButton referentiel="LINGE" onTermine={onSynchronised} />

      <Separator />

      <button
        onClick={onAssociateRfid}
        disabled={!hasSelection}
        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#8b5cf6]/30 rounded-[14px] text-sm font-bold text-[#8b5cf6] hover:bg-[#8b5cf6]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
      >
        <Tag className="w-4 h-4 stroke-[2.5]" /> {t('linge.associate_rfid')}
      </button>

      <button
        disabled={!hasSelection}
        onClick={onDetail}
        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#006f94]/30 rounded-[14px] text-sm font-bold text-[#006f94] hover:bg-[#006f94]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
      >
        <Eye className="w-4 h-4 stroke-[2.5]" /> {t('common.details')}
      </button>

      <button
        disabled={!hasSelection}
        onClick={onEdit}
        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#e67700]/30 rounded-[14px] text-sm font-bold text-[#e67700] hover:bg-[#e67700]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
      >
        <Edit className="w-4 h-4 stroke-[2.5]" /> {t('common.edit')}
      </button>

      <button
        disabled={!hasSelection}
        onClick={onDelete}
        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#e03131]/30 rounded-[14px] text-sm font-bold text-[#e03131] hover:bg-[#e03131]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
      >
        <Trash2 className="w-4 h-4 stroke-[2.5]" /> {t('common.delete')}
      </button>

      <button
        disabled={!hasSelection}
        onClick={onPrintLabel}
        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#0d9488]/30 rounded-[14px] text-sm font-bold text-[#0d9488] hover:bg-[#0d9488]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
      >
        <LabelIcon className="w-4 h-4" strokeWidth={2.2} /> {t('linge.label')}
      </button>

      <button
        disabled={!hasSelection}
        onClick={onHistory}
        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#0ca678]/30 rounded-[14px] text-sm font-bold text-[#0ca678] hover:bg-[#0ca678]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
      >
        <History className="w-4 h-4 stroke-[2.5]" /> {t('linge.history')}
      </button>

      <button
        onClick={onRefresh}
        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-300 rounded-[14px] text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
      >
        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> {t('common.refresh')}
      </button>
    </div>
  );
}
