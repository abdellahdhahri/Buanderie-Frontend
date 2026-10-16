import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Building2, ImageUp, Link2, Trash2, RotateCcw, Info } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
  getEstablishment, saveEstablishment, resetEstablishment, resizeLogo,
  DEFAULT_ESTABLISHMENT, DEFAULT_LOGO, DEFAULT_LOGO_FALLBACK,
} from "../../../services/establishmentService";
import { SettingsCard } from "./SettingsUI";

const MAX_FILE_MB = 5;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

// Aperçu de l'en-tête de la page de connexion
function LoginPreview({ name, city, logo }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-border">
      <div className="relative flex flex-col items-center gap-3 bg-gradient-to-br from-slate-900 via-teal-900 to-teal-700 px-6 py-7">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(45,212,191,0.25),transparent_60%)]" />
        <div className="relative rounded-2xl border border-white/40 bg-white/95 px-4 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
          {logo ? (
            <img
              src={logo}
              alt={name}
              className="block h-10 w-auto max-w-[200px] object-contain"
              onError={(e) => {
                if (logo === DEFAULT_LOGO && e.currentTarget.src !== DEFAULT_LOGO_FALLBACK) {
                  e.currentTarget.src = DEFAULT_LOGO_FALLBACK;
                }
              }}
            />
          ) : (
            <Building2 className="h-10 w-10 text-teal-700" />
          )}
        </div>
        <div className="relative h-2 w-40 rounded-full bg-white/20" />
        <div className="relative h-2 w-28 rounded-full bg-white/10" />
      </div>
      <div className="flex items-center justify-center gap-3 border-t border-slate-100 bg-white px-4 py-3 text-[12px] font-medium text-slate-400 dark:border-border dark:bg-card">
        <span className="truncate">{name || "—"}</span>
        {city && <><span className="text-slate-300">•</span><span className="truncate">{city}</span></>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ÉTABLISSEMENT — nom et logo affichés sur la page de connexion (admin)
   ═══════════════════════════════════════════════════════════════════════════ */
export function EstablishmentSection() {
  const { t } = useTranslation();
  const saved = getEstablishment();
  const [form, setForm] = useState(saved);
  const [urlInput, setUrlInput] = useState(saved.logo.startsWith("data:") ? "" : saved.logo);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const isDirty = JSON.stringify(form) !== JSON.stringify(getEstablishment());
  const nameMissing = !form.name.trim();

  const importFile = async (file) => {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      toast.error(t("settings.establishment.bad_type", "Format non pris en charge (PNG, JPG, WebP ou SVG)."));
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(t("settings.establishment.too_big", "Image trop lourde ({{max}} Mo maximum).", { max: MAX_FILE_MB }));
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await resizeLogo(file);
      setForm((f) => ({ ...f, logo: dataUrl }));
      setUrlInput("");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const applyUrl = () => {
    const url = urlInput.trim();
    if (!/^https?:\/\//i.test(url)) {
      toast.error(t("settings.establishment.bad_url", "L'adresse doit commencer par http:// ou https://"));
      return;
    }
    setForm((f) => ({ ...f, logo: url }));
  };

  const handleSave = () => {
    if (nameMissing) return;
    try {
      const value = saveEstablishment(form);
      setForm(value);
      toast.success(t("settings.establishment.saved", "Paramètres de l'établissement enregistrés."));
    } catch {
      toast.error(t("settings.establishment.save_error", "Enregistrement impossible : le logo est peut-être trop lourd."));
    }
  };

  const handleReset = () => {
    const value = resetEstablishment();
    setForm(value);
    setUrlInput(value.logo);
    toast.success(t("settings.establishment.reset_done", "Valeurs par défaut restaurées."));
  };

  return (
    <div className="flex flex-col gap-5">
      <SettingsCard
        icon={<Building2 className="h-[17px] w-[17px]" />}
        title={t("settings.establishment.title", "Identité de l'établissement")}
        description={t("settings.establishment.desc", "Nom et logo affichés sur la page de connexion et les étiquettes.")}
        footer={
          <>
            <Button type="button" variant="ghost" onClick={handleReset} className="mr-auto">
              <RotateCcw className="h-4 w-4" />
              {t("settings.establishment.reset", "Valeurs par défaut")}
            </Button>
            <Button type="button" variant="outline" onClick={() => { const s = getEstablishment(); setForm(s); setUrlInput(s.logo.startsWith("data:") ? "" : s.logo); }} disabled={!isDirty}>
              {t("common.cancel", "Annuler")}
            </Button>
            <Button type="button" onClick={handleSave} disabled={!isDirty || nameMissing || busy}>
              {t("common.save", "Enregistrer")}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-x-8 gap-y-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          {/* ─── Formulaire ─── */}
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
              <div className="flex flex-col gap-1">
                <Input
                  label={t("settings.establishment.name", "Nom de l'établissement")}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder={DEFAULT_ESTABLISHMENT.name}
                  error={nameMissing ? t("settings.establishment.name_required", "Le nom est obligatoire.") : undefined}
                />
              </div>
              <Input
                label={t("settings.establishment.city", "Ville")}
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                placeholder={DEFAULT_ESTABLISHMENT.city}
              />
            </div>

            {/* Logo : glisser-déposer / parcourir */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[12.5px] font-medium text-slate-600 dark:text-muted-foreground">
                {t("settings.establishment.logo", "Logo")}
              </span>
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileRef.current?.click()}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); importFile(e.dataTransfer.files?.[0]); }}
                className={`flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed p-4 transition-colors ${
                  dragging
                    ? "border-teal-500 bg-teal-50/70 dark:bg-teal-500/10"
                    : "border-slate-200 bg-slate-50/50 hover:border-teal-400 hover:bg-teal-50/40 dark:border-border dark:bg-white/5"
                }`}
              >
                <div className="flex h-16 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-slate-200 dark:ring-border">
                  {form.logo ? (
                    <img src={form.logo} alt="" className="max-h-12 max-w-[96px] object-contain" />
                  ) : (
                    <Building2 className="h-7 w-7 text-slate-300" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="m-0 flex items-center gap-2 text-[13.5px] font-medium text-slate-800 dark:text-foreground">
                    <ImageUp className="h-4 w-4 text-teal-600" />
                    {busy
                      ? t("settings.establishment.processing", "Traitement de l'image…")
                      : t("settings.establishment.drop", "Glissez une image ici ou cliquez pour parcourir")}
                  </p>
                  <p className="m-0 mt-0.5 text-[12px] text-slate-500 dark:text-muted-foreground">
                    {t("settings.establishment.formats", "PNG, JPG, WebP ou SVG · fond transparent recommandé · {{max}} Mo max.", { max: MAX_FILE_MB })}
                  </p>
                </div>
                {form.logo && form.logo !== DEFAULT_LOGO && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setForm((f) => ({ ...f, logo: DEFAULT_LOGO })); setUrlInput(DEFAULT_LOGO); }}
                    title={t("settings.establishment.remove_logo", "Revenir au logo par défaut")}
                    className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept={ACCEPTED.join(",")}
                  className="hidden"
                  onChange={(e) => { importFile(e.target.files?.[0]); e.target.value = ""; }}
                />
              </div>
            </div>

            {/* Logo : adresse web */}
            <div className="flex flex-col gap-1.5">
              <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-slate-600 dark:text-muted-foreground">
                <Link2 className="h-3.5 w-3.5" />
                {t("settings.establishment.logo_url", "Ou utiliser l'adresse d'une image")}
              </span>
              <div className="flex gap-2">
                <Input
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applyUrl()}
                  placeholder="https://…/logo.png"
                />
                <Button type="button" variant="outline" onClick={applyUrl} disabled={!urlInput.trim()}>
                  {t("settings.establishment.apply", "Appliquer")}
                </Button>
              </div>
            </div>
          </div>

          {/* ─── Aperçu en direct ─── */}
          <div className="flex flex-col gap-2">
            <span className="text-[12.5px] font-medium text-slate-600 dark:text-muted-foreground">
              {t("settings.establishment.preview", "Aperçu de la page de connexion")}
            </span>
            <LoginPreview name={form.name} city={form.city} logo={form.logo} />
          </div>
        </div>
      </SettingsCard>

      <p className="m-0 flex items-start gap-2 px-1 text-[12.5px] text-slate-500 dark:text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {t("settings.establishment.local_note", "Ces paramètres sont enregistrés sur ce navigateur. Répétez l'opération sur chaque poste tant qu'ils ne sont pas stockés sur le serveur.")}
      </p>
    </div>
  );
}
