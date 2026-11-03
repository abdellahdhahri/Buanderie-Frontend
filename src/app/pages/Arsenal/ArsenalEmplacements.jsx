import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Edit, Trash2, Loader2, LayoutGrid } from "lucide-react";
import Swal from "sweetalert2";
import { Input } from "../../components/ui/input";
import { FormModal, FormSection } from "../../components/ui/modal-kit";
import { arsenalService, emplacementService } from "../../services/arsenalService";
import { useIntegration } from "../../hooks/useIntegration";

const VIDE = { nom: "", numero: "", codeBarre: "", actif: true };

export function BadgeImporte({ item }) {
  const { t } = useTranslation();
  if (item?.source !== "EXTERNE") return null;
  return (
    <span className="ml-1.5 inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 ring-1 ring-indigo-200">
      {t("integration.imported", "Importé")}
    </span>
  );
}

export function BadgeInactif({ item }) {
  const { t } = useTranslation();
  if (item?.actif !== false) return null;
  return (
    <span className="ml-1.5 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 ring-1 ring-slate-200">
      {t("common.inactive", "Inactif")}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 🗄️ EMPLACEMENTS D'UN ARSENAL
// ═══════════════════════════════════════════════════════════════════════════
export function ArsenalEmplacements({ arsenal, tous }) {
  const { t } = useTranslation();
  const { estImporte } = useIntegration();
  const [emplacements, setEmplacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rafraichir, setRafraichir] = useState(0);
  const [edition, setEdition] = useState(null);
  const [form, setForm] = useState(VIDE);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let actif = true;
    arsenalService.getEmplacements(arsenal.id, tous)
      .then((data) => actif && setEmplacements(Array.isArray(data) ? data : []))
      .catch((err) => actif && Swal.fire({ title: t("common.error"), text: err.message, icon: "error" }))
      .finally(() => actif && setLoading(false));
    return () => { actif = false; };
  }, [arsenal.id, tous, rafraichir, t]);

  const recharger = () => {
    setLoading(true);
    setRafraichir((n) => n + 1);
  };

  const ouvrir = (emp) => {
    setEdition(emp || "nouveau");
    setForm(emp
      ? { nom: emp.nom || "", numero: emp.numero ?? "", codeBarre: emp.codeBarre || "", actif: emp.actif !== false }
      : VIDE);
  };

  const enregistrer = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        arsenalId: arsenal.id,
        nom: form.nom.trim(),
        numero: form.numero === "" ? null : Number(form.numero),
        codeBarre: form.codeBarre.trim() || null,
        actif: form.actif,
      };
      if (edition === "nouveau") await emplacementService.create(payload);
      else await emplacementService.update(edition.id, payload);
      setEdition(null);
      recharger();
      Swal.fire({ title: "✅", text: t("arsenal.location_saved", "Emplacement enregistré."), icon: "success", timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ title: t("common.error"), text: err.message, icon: "error" });
    } finally {
      setSaving(false);
    }
  };

  const desactiver = async (emp) => {
    const result = await Swal.fire({
      title: t("arsenal.location_disable_confirm", "Désactiver cet emplacement ?"),
      text: emp.nom,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: t("arsenal.disable", "Désactiver"),
      cancelButtonText: t("common.cancel"),
    });
    if (!result.isConfirmed) return;
    try {
      await emplacementService.desactiver(emp.id);
      recharger();
    } catch (err) {
      Swal.fire({ title: t("common.error"), text: err.message, icon: "error" });
    }
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-slate-700">{t("arsenal.locations", "Emplacements")}</span>
          <span className="rounded-full bg-white px-2 py-0.5 text-xs ring-1 ring-slate-200">{loading ? "..." : emplacements.length}</span>
        </div>
        {!estImporte("EMPLACEMENT") && (
          <button
            onClick={() => ouvrir(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#0ca678]/30 rounded-[10px] text-xs font-bold text-[#0ca678] hover:bg-[#0ca678]/5 transition-all"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> {t("arsenal.new_location", "Ajouter un emplacement")}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-4 gap-2 text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">{t("common.loading")}</span>
        </div>
      ) : emplacements.length === 0 ? (
        <p className="text-center py-4 text-sm text-slate-400">{t("arsenal.no_locations", "Aucun emplacement.")}</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-3 py-2 text-center">{t("arsenal.number", "N°")}</th>
                <th className="px-3 py-2 text-left">{t("common.name")}</th>
                <th className="px-3 py-2 text-center">{t("arsenal.barcode", "Code-barres")}</th>
                <th className="px-3 py-2 text-center">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {emplacements.map((emp) => {
                const lectureSeule = emp.source === "EXTERNE";
                return (
                  <tr key={emp.id} className={`border-t border-slate-100 ${emp.actif === false ? "opacity-60" : ""}`}>
                    <td className="px-3 py-2 text-center font-mono">{emp.numero ?? "—"}</td>
                    <td className="px-3 py-2">
                      {emp.nom}
                      <BadgeImporte item={emp} />
                      <BadgeInactif item={emp} />
                    </td>
                    <td className="px-3 py-2 text-center font-mono text-xs">{emp.codeBarre || "—"}</td>
                    <td className="px-3 py-2 text-center">
                      {lectureSeule ? (
                        <span className="text-xs text-slate-400">{t("integration.read_only", "Lecture seule")}</span>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => ouvrir(emp)} className="p-1.5 hover:bg-accent rounded-lg" title={t("common.edit")}>
                            <Edit className="w-4 h-4 text-[#006f94]" />
                          </button>
                          {emp.actif !== false && (
                            <button onClick={() => desactiver(emp)} className="p-1.5 hover:bg-destructive/10 text-destructive rounded-lg" title={t("arsenal.disable", "Désactiver")}>
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <FormModal
        isOpen={!!edition}
        onClose={() => setEdition(null)}
        title={edition === "nouveau" ? t("arsenal.new_location", "Ajouter un emplacement") : `${t("arsenal.edit_location", "Modifier l'emplacement")} #${edition?.id ?? ""}`}
        mode={edition === "nouveau" ? "create" : "edit"}
        onSubmit={enregistrer}
        saving={saving}
      >
        <FormSection title={arsenal.nom} icon="location" columns={2}>
          <Input label={`${t("common.name")} *`} value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
          <Input type="number" label={t("arsenal.number", "N°")} value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} />
          <Input label={t("arsenal.barcode", "Code-barres")} value={form.codeBarre} onChange={(e) => setForm({ ...form, codeBarre: e.target.value })} />
          <label className="flex items-center gap-2 text-sm font-medium self-end h-10">
            <input type="checkbox" checked={form.actif} onChange={(e) => setForm({ ...form, actif: e.target.checked })} />
            {t("common.active", "Actif")}
          </label>
        </FormSection>
      </FormModal>
    </div>
  );
}
