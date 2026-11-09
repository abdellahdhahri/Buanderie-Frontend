import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Building2, ImageUp, Trash2, Palette, Loader2, RotateCcw, ShieldAlert, BedDouble, DoorOpen, Check } from "lucide-react";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import {
  identiteService, chargerEstablishment, getEstablishment, setEstablishment, urlLogo,
  DEFAULT_APP_NAME, DEFAULT_LOGO, TYPES_ETABLISSEMENT, LOGO_TYPES, LOGO_MAX_OCTETS,
} from "../../../../services/establishmentService";
import { SettingsCard, SettingRow, Toggle, ChoiceCard } from "./SettingsUI";

const COULEUR_DEFAUT = "#0d9488";
const CHAMPS = ["raisonSociale", "nomApplication", "typeEtablissement", "couleurPrimaire", "adresse", "telephone", "email", "piedDePage"];
const selectCls = "h-10 w-full rounded-[10px] border border-slate-200 bg-white px-3 text-[13.5px] text-slate-800 focus:outline-none focus:ring-[3px] focus:ring-teal-500/12 dark:border-border dark:bg-card dark:text-foreground";
const labelCls = "text-[12.5px] font-medium text-slate-600 dark:text-muted-foreground";

const toForm = (identite) => Object.fromEntries(CHAMPS.map((k) => [k, identite?.[k] ?? ""]));

const couleurValide = (c) => /^#[0-9a-f]{6}$/i.test(c);
const emailValide = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

function LoginPreview({ name, sub, logo, color }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-border">
      <div
        className="relative flex flex-col items-center gap-3 px-6 py-7"
        style={{ background: `linear-gradient(135deg, #0f172a, ${color})` }}
      >
        <div className="relative rounded-2xl border border-white/40 bg-white/95 px-4 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
          <img
            src={logo}
            alt={name}
            className="block h-10 w-auto max-w-[200px] object-contain"
            onError={(e) => { if (!e.currentTarget.src.endsWith(DEFAULT_LOGO)) e.currentTarget.src = DEFAULT_LOGO; }}
          />
        </div>
        <div className="relative text-center">
          <p className="m-0 text-[15px] font-extrabold text-white">{name || DEFAULT_APP_NAME}</p>
          {sub && <p className="m-0 mt-0.5 text-[11.5px] font-semibold text-white/70">{sub}</p>}
        </div>
      </div>
      <div className="flex items-center justify-center gap-2 border-t border-slate-100 bg-white px-4 py-3 dark:border-border dark:bg-card">
        <span className="h-2 w-2 rounded-full" style={{ background: color }} />
        <span className="text-[12px] font-medium text-slate-500">{color}</span>
      </div>
    </div>
  );
}

export function EstablishmentSection() {
  const { t } = useTranslation();
  const [identite, setIdentite] = useState(getEstablishment);
  const [form, setForm] = useState(() => toForm(getEstablishment()));
  const [chargement, setChargement] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoBusy, setLogoBusy] = useState(false);
  const [circuitBusy, setCircuitBusy] = useState(false);
  const [rattachementBusy, setRattachementBusy] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    chargerEstablishment({ forcer: true }).then((data) => {
      setIdentite(data);
      setForm(toForm(data));
      setChargement(false);
    });
  }, []);

  const appliquer = (data) => {
    const valeur = setEstablishment(data);
    setIdentite(valeur);
    return valeur;
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const erreurs = {
    nomApplication: !form.nomApplication.trim() ? t("settings.establishment.name_required", "Le nom de l'application est obligatoire.") : null,
    couleurPrimaire: form.couleurPrimaire && !couleurValide(form.couleurPrimaire) ? t("settings.establishment.bad_color", "Format attendu : #RRGGBB") : null,
    email: form.email.trim() && !emailValide(form.email.trim()) ? t("settings.establishment.bad_email", "Adresse e-mail invalide.") : null,
  };
  const invalide = Object.values(erreurs).some(Boolean);
  const isDirty = JSON.stringify(form) !== JSON.stringify(toForm(identite));

  const handleSave = async () => {
    if (invalide) return;
    setSaving(true);
    try {
      const payload = Object.fromEntries(CHAMPS.map((k) => [k, String(form[k]).trim()]));
      const valeur = appliquer(await identiteService.modifier(payload));
      setForm(toForm(valeur));
      toast.success(t("settings.establishment.saved", "Identité de l'établissement enregistrée."));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const choisirLogo = async (fichier) => {
    if (!fichier) return;
    if (!LOGO_TYPES.includes(fichier.type)) {
      toast.error(t("settings.establishment.bad_type", "Format non pris en charge : PNG, JPEG ou WebP uniquement."));
      return;
    }
    if (fichier.size > LOGO_MAX_OCTETS) {
      toast.error(t("settings.establishment.too_big", "Le logo pèse {{size}} Ko : 500 Ko maximum. Réduisez ou compressez l'image.", {
        size: Math.ceil(fichier.size / 1024),
      }));
      return;
    }
    setLogoBusy(true);
    try {
      appliquer(await identiteService.envoyerLogo(fichier));
      toast.success(t("settings.establishment.logo_saved", "Logo mis à jour."));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLogoBusy(false);
    }
  };

  const supprimerLogo = async () => {
    setLogoBusy(true);
    try {
      appliquer(await identiteService.supprimerLogo());
      toast.success(t("settings.establishment.logo_removed", "Logo supprimé : le logo par défaut est utilisé."));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLogoBusy(false);
    }
  };

  const basculerCircuit = async (actif) => {
    setCircuitBusy(true);
    try {
      await identiteService.modifier({ circuitInfecteActif: actif });
      const valeur = await chargerEstablishment({ forcer: true });
      setIdentite(valeur);
      toast.success(actif
        ? t("settings.establishment.infected_on", "Circuit infecté activé.")
        : t("settings.establishment.infected_off", "Circuit infecté désactivé : les écrans et indicateurs d'infection sont masqués."));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCircuitBusy(false);
    }
  };

  const changerRattachement = async (niveau) => {
    if (niveau === identite?.niveauRattachement || rattachementBusy) return;
    setRattachementBusy(true);
    try {
      await identiteService.modifier({ niveauRattachement: niveau });
      const valeur = await chargerEstablishment({ forcer: true });
      setIdentite(valeur);
      toast.success(niveau === "CHAMBRE"
        ? t("settings.establishment.attach_room_saved", "Le linge est désormais rattaché à la chambre.")
        : t("settings.establishment.attach_bed_saved", "Le linge est désormais rattaché au lit."));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRattachementBusy(false);
    }
  };

  const logo = urlLogo(identite);
  const circuitActif = identite?.circuitInfecteActif !== false;
  const couleurApercu = couleurValide(form.couleurPrimaire) ? form.couleurPrimaire : COULEUR_DEFAUT;

  return (
    <div className="flex flex-col gap-5">
      <SettingsCard
        icon={<Building2 className="h-[17px] w-[17px]" />}
        title={t("settings.establishment.title", "Identité de l'établissement")}
        description={t("settings.establishment.desc", "Nom, logo et couleur affichés dans l'en-tête, le menu, la page de connexion et les étiquettes.")}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setForm(toForm(identite))} disabled={!isDirty || saving}>
              {t("common.cancel", "Annuler")}
            </Button>
            <Button type="button" onClick={handleSave} disabled={!isDirty || invalide || saving || chargement}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("common.save", "Enregistrer")}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-x-8 gap-y-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label={t("settings.establishment.app_name", "Nom de l'application")}
                value={form.nomApplication}
                onChange={set("nomApplication")}
                placeholder={DEFAULT_APP_NAME}
                error={erreurs.nomApplication || undefined}
              />
              <Input
                label={t("settings.establishment.company_name", "Raison sociale")}
                value={form.raisonSociale}
                onChange={set("raisonSociale")}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>{t("settings.establishment.type", "Type d'établissement")}</label>
                <select value={form.typeEtablissement} onChange={set("typeEtablissement")} className={selectCls}>
                  <option value="">{t("settings.establishment.type_none", "Non précisé")}</option>
                  {TYPES_ETABLISSEMENT.map((type) => (
                    <option key={type} value={type}>{t(`settings.establishment.types.${type}`, {
                      HOPITAL: "Hôpital", CLINIQUE: "Clinique", HOTEL: "Hôtel", AUTRE: "Autre",
                    }[type])}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>{t("settings.establishment.color", "Couleur principale")}</label>
                <div className="flex items-start gap-2">
                  <label
                    className="relative flex h-10 w-12 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-[10px] border border-slate-200 dark:border-border"
                    style={{ background: couleurApercu }}
                    title={t("settings.establishment.pick_color", "Choisir une couleur")}
                  >
                    <Palette className="h-4 w-4 text-white drop-shadow" />
                    <input
                      type="color"
                      value={couleurApercu}
                      onChange={set("couleurPrimaire")}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                  </label>
                  <Input
                    value={form.couleurPrimaire}
                    onChange={set("couleurPrimaire")}
                    placeholder={t("settings.establishment.color_default", "Par défaut")}
                    maxLength={7}
                    error={erreurs.couleurPrimaire || undefined}
                  />
                  {form.couleurPrimaire && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setForm((f) => ({ ...f, couleurPrimaire: "" }))}
                      title={t("settings.establishment.color_reset", "Revenir à la couleur par défaut")}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <Input
              label={t("settings.establishment.address", "Adresse")}
              value={form.adresse}
              onChange={set("adresse")}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label={t("settings.establishment.phone", "Téléphone")}
                type="tel"
                value={form.telephone}
                onChange={set("telephone")}
              />
              <Input
                label={t("settings.establishment.email", "E-mail")}
                type="email"
                value={form.email}
                onChange={set("email")}
                error={erreurs.email || undefined}
              />
            </div>

            <Input
              label={t("settings.establishment.footer", "Pied de page")}
              value={form.piedDePage}
              onChange={set("piedDePage")}
              placeholder={t("settings.establishment.footer_hint", "Texte affiché en bas de la page de connexion")}
            />

            <div className="flex flex-col gap-1.5">
              <span className={labelCls}>{t("settings.establishment.logo", "Logo")}</span>
              <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-border dark:bg-white/5">
                <div className="flex h-16 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-slate-200 dark:ring-border">
                  {logoBusy ? (
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                  ) : (
                    <img src={logo || DEFAULT_LOGO} alt="" className="max-h-12 max-w-[96px] object-contain" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="m-0 text-[13px] font-medium text-slate-800 dark:text-foreground">
                    {logo
                      ? t("settings.establishment.logo_custom", "Logo de l'établissement")
                      : t("settings.establishment.logo_default", "Logo par défaut du produit")}
                  </p>
                  <p className="m-0 mt-0.5 text-[12px] text-slate-500 dark:text-muted-foreground">
                    {t("settings.establishment.formats", "PNG, JPEG ou WebP · 500 Ko maximum · fond transparent recommandé")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={logoBusy}>
                    <ImageUp className="h-4 w-4" />
                    {t("settings.establishment.choose_logo", "Choisir un logo")}
                  </Button>
                  {logo && (
                    <Button type="button" variant="ghost" onClick={supprimerLogo} disabled={logoBusy} className="text-red-600 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                      {t("settings.establishment.remove_logo", "Supprimer le logo")}
                    </Button>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept={LOGO_TYPES.join(",")}
                  className="hidden"
                  onChange={(e) => { choisirLogo(e.target.files?.[0]); e.target.value = ""; }}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className={labelCls}>{t("settings.establishment.preview", "Aperçu de la page de connexion")}</span>
            <LoginPreview
              name={form.nomApplication}
              sub={form.raisonSociale}
              logo={logo || DEFAULT_LOGO}
              color={couleurApercu}
            />
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        icon={<ShieldAlert className="h-[17px] w-[17px]" />}
        title={t("settings.establishment.infected_title", "Circuit infecté")}
        description={t("settings.establishment.infected_desc", "Désactivez-le pour un établissement sans linge infecté, un hôtel par exemple.")}
      >
        <SettingRow
          label={t("settings.establishment.infected_label", "Circuit infecté")}
          hint={circuitActif
            ? t("settings.establishment.infected_hint_on", "Sacs infectés, choix « infecté » en collecte et réception, lits infectés et indicateurs d'infection sont affichés.")
            : t("settings.establishment.infected_hint_off", "Les écrans et indicateurs d'infection sont masqués.")}
        >
          <span className="inline-flex items-center gap-2">
            {circuitBusy && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
            <Toggle
              checked={circuitActif}
              onChange={basculerCircuit}
              disabled={circuitBusy || chargement}
              label={t("settings.establishment.infected_label", "Circuit infecté")}
            />
          </span>
        </SettingRow>
      </SettingsCard>

      <SettingsCard
        icon={<BedDouble className="h-[17px] w-[17px]" />}
        title={t("settings.establishment.attach_title", "Rattachement du linge")}
        description={t("settings.establishment.attach_desc", "Le linge distribué et collecté est suivi au lit (hôpital, clinique) ou à la chambre (hôtel).")}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { id: "LIT", Icon: BedDouble, label: t("settings.establishment.attach_bed", "Lit"), hint: t("settings.establishment.attach_bed_hint", "Distribution et collecte lit par lit.") },
            { id: "CHAMBRE", Icon: DoorOpen, label: t("settings.establishment.attach_room", "Chambre"), hint: t("settings.establishment.attach_room_hint", "Le linge est déposé et collecté à la chambre, sans passer par les lits.") },
          ].map(({ id, Icon, label, hint }) => {
            const actif = (identite?.niveauRattachement || "LIT") === id;
            return (
              <ChoiceCard key={id} selected={actif} onClick={() => changerRattachement(id)}>
                <div className="flex items-start gap-3 p-1 text-left">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-white/5 dark:text-teal-300">
                    {rattachementBusy && !actif ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="m-0 text-[13.5px] font-semibold text-slate-800 dark:text-foreground">{label}</p>
                    <p className="m-0 text-[12px] text-slate-500 dark:text-muted-foreground">{hint}</p>
                  </div>
                  {actif && <Check className="h-4 w-4 text-teal-600" />}
                </div>
              </ChoiceCard>
            );
          })}
        </div>
      </SettingsCard>
    </div>
  );
}
