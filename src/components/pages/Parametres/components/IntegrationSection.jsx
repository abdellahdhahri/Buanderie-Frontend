import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Loader2, FlaskConical, RefreshCcw, History, Wand2, Info, ChevronRight, ArrowLeft, Building2, Cloud,
} from "lucide-react";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import {
  integrationService, lancerSynchronisation, setIntegrationCourante,
} from "../../../../services/integrationService";
import { useIntegration } from "../../../../hooks/useIntegration";
import { afficherJournal } from "../../../../utils/journalSynchro";
import { formatDateTime } from "../../../../utils/appSettings";
import { SettingsCard, SettingRow, Toggle } from "./SettingsUI";

const REFERENTIELS = ["SERVICE", "PERSONNEL", "CHAMBRE", "LIT", "LIT_INFECTE", "ARSENAL", "EMPLACEMENT", "LINGE", "MACHINE"];
const REFERENTIEL_LABELS = {
  SERVICE: "Services", PERSONNEL: "Personnel", CHAMBRE: "Chambres", LIT: "Lits", LIT_INFECTE: "Lits infectés",
  ARSENAL: "Arsenaux", EMPLACEMENT: "Emplacements", LINGE: "Linges", MACHINE: "Machines",
};
const REFERENTIEL_INFOS = {
  LIT: ["integration.info.LIT", "Synchronisez d'abord les chambres (avec Cubix, les lits sont lus chambre par chambre ; le test ne lit que la première chambre)."],
  LIT_INFECTE: ["integration.info.LIT_INFECTE", "L'état d'infection est mis à jour à chaque synchronisation ; la fréquence automatique minimale est de 5 minutes."],
};
const rang = (r) => (REFERENTIELS.includes(r) ? REFERENTIELS.indexOf(r) : REFERENTIELS.length);
const TYPES_CONNECTEUR = ["STANDARD", "PERSONNALISE"];
const TYPES_AUTH = ["AUCUNE", "BASIC", "BEARER", "CLE_API"];
const AUTH_LABELS = { AUCUNE: "Aucune", BASIC: "Utilisateur et mot de passe", BEARER: "Jeton (Bearer)", CLE_API: "Clé API" };

const carteCls = "overflow-hidden rounded-[14px] border border-slate-200 bg-slate-50/60 dark:border-border dark:bg-white/5";
const selectCls = "h-10 w-full rounded-[10px] border border-slate-200 bg-white px-3 text-[13.5px] text-slate-800 focus:outline-none focus:ring-[3px] focus:ring-teal-500/12 dark:border-border dark:bg-card dark:text-foreground";

const toForm = (data) => {
  const endpoints = data?.endpoints || [];
  const refs = [...endpoints.map((e) => e.referentiel), ...REFERENTIELS.filter((r) => !endpoints.some((e) => e.referentiel === r))]
    .map((r, i) => ({ r, i }))
    .sort((a, b) => rang(a.r) - rang(b.r) || a.i - b.i)
    .map(({ r }) => r);
  return {
    configuration: { ...(data?.configuration || {}), jeton: "", motDePasse: "" },
    endpoints: refs.map((r) => {
      const e = endpoints.find((x) => x.referentiel === r) || { referentiel: r };
      return { ...e, actif: e.actif === true, chemin: e.chemin || "", cheminListe: e.cheminListe || "", correspondanceChamps: { ...(e.correspondanceChamps || {}) } };
    }),
  };
};

const toPayload = ({ configuration: c, endpoints }) => ({
  mode: c.mode || "INTERNE",
  typeConnecteur: c.typeConnecteur || undefined,
  urlBase: c.urlBase ?? "",
  typeAuthentification: c.typeAuthentification || "AUCUNE",
  jeton: c.jeton ? c.jeton : undefined,
  nomEnteteCle: c.nomEnteteCle ?? "",
  utilisateur: c.utilisateur ?? "",
  motDePasse: c.motDePasse ? c.motDePasse : undefined,
  frequenceMinutes: Number(c.frequenceMinutes) || 60,
  synchroAutomatique: c.synchroAutomatique !== false,
  endpoints: endpoints.map((e) => ({
    referentiel: e.referentiel,
    actif: e.actif,
    chemin: e.chemin,
    cheminListe: e.cheminListe,
    correspondanceChamps: e.correspondanceChamps,
  })),
});

const memePayload = (a, b) => JSON.stringify(toPayload(a)) === JSON.stringify(toPayload(b));

const avecStatuts = (form, serveur) => ({
  ...form,
  endpoints: form.endpoints.map((e) => {
    const s = serveur.endpoints.find((x) => x.referentiel === e.referentiel);
    return s ? { ...e, derniereSynchro: s.derniereSynchro, dernierStatut: s.dernierStatut, dernierMessage: s.dernierMessage } : e;
  }),
});

function StatutBadge({ statut }) {
  if (!statut) return <span className="text-[12px] text-slate-400">—</span>;
  const erreur = /ERREUR|ECHEC/i.test(statut);
  const partiel = /PARTIEL|EN_COURS/i.test(statut);
  const cls = erreur
    ? "bg-red-50 text-red-700 ring-red-200"
    : partiel
      ? "bg-amber-50 text-amber-700 ring-amber-200"
      : "bg-emerald-50 text-emerald-700 ring-emerald-200";
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${cls}`}>{statut}</span>;
}

const etatEndpoint = (e) => {
  if (!e.actif) return "OFF";
  if (!e.chemin?.trim() || !e.correspondanceChamps.idExterne?.trim()) return "INCOMPLET";
  return "PRET";
};

function EtatPastille({ etat }) {
  const { t } = useTranslation();
  const styles = {
    OFF: ["bg-slate-100 text-slate-500 ring-slate-200", t("integration.state_off", "Géré dans la buanderie")],
    INCOMPLET: ["bg-amber-50 text-amber-700 ring-amber-200", t("integration.state_incomplete", "À compléter")],
    PRET: ["bg-teal-50 text-teal-700 ring-teal-200", t("integration.state_ready", "Activé")],
  };
  const [cls, label] = styles[etat];
  return <span className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${cls}`}>{label}</span>;
}

function StepTitle({ numero, titre, description }) {
  return (
    <div className="flex items-start gap-3 px-1">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-600 text-[13px] font-bold text-white">{numero}</span>
      <div className="min-w-0">
        <h3 className="m-0 text-[15px] font-semibold text-slate-900 dark:text-foreground">{titre}</h3>
        {description && <p className="m-0 mt-0.5 text-[12.5px] text-slate-500 dark:text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}

function ModeChoix({ value, onChange }) {
  const { t } = useTranslation();
  const options = [
    {
      value: "INTERNE",
      Icon: Building2,
      titre: t("integration.mode_interne", "Interne"),
      texte: t("integration.mode_interne_desc", "Toutes les données sont créées et modifiées dans la buanderie. Aucune synchronisation."),
    },
    {
      value: "EXTERNE",
      Icon: Cloud,
      titre: t("integration.mode_externe", "Externe"),
      texte: t("integration.mode_externe_desc", "Les référentiels activés ci-dessous viennent du système externe et ne se créent plus dans la buanderie."),
    },
  ];
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2" role="radiogroup">
      {options.map(({ value: v, Icon, titre, texte }) => {
        const actif = value === v;
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={actif}
            onClick={() => onChange(v)}
            className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-all ${
              actif
                ? "border-teal-500 bg-teal-50/60 ring-2 ring-teal-500/20 dark:bg-teal-500/10"
                : "border-slate-200 bg-white hover:border-slate-300 dark:border-border dark:bg-card"
            }`}
          >
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${actif ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-500 dark:bg-white/10"}`}>
              <Icon className="h-[18px] w-[18px]" />
            </span>
            <span className="min-w-0">
              <span className="block text-[14px] font-semibold text-slate-900 dark:text-foreground">{titre}</span>
              <span className="mt-0.5 block text-[12.5px] text-slate-500 dark:text-muted-foreground">{texte}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function EndpointRow({ endpoint, champs, dirty, ouvert, onToggle, onChange }) {
  const { t } = useTranslation();
  const { enCours } = useIntegration();
  const [testing, setTesting] = useState(false);
  const ref = endpoint.referentiel;
  const syncing = enCours(ref);
  const etat = etatEndpoint(endpoint);
  const set = (patch) => onChange({ ...endpoint, ...patch });
  const setChamp = (champ, valeur) => set({ correspondanceChamps: { ...endpoint.correspondanceChamps, [champ]: valeur } });
  const listeChamps = [...champs, ...Object.keys(endpoint.correspondanceChamps).filter((c) => !champs.includes(c))];
  const info = REFERENTIEL_INFOS[ref];
  const nom = t(`integration.referentiel.${ref}`, REFERENTIEL_LABELS[ref] || ref);

  const tester = async () => {
    setTesting(true);
    try {
      const res = await integrationService.tester(ref);
      const ok = (res.succes ?? res.success ?? res.ok) !== false;
      const message = res.message || t("integration.test_ok", "Connexion réussie.");
      (ok ? toast.success : toast.error)(`${REFERENTIEL_LABELS[ref] || ref} : ${message}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setTesting(false);
    }
  };

  const synchroniser = async () => {
    try {
      afficherJournal(await lancerSynchronisation(ref), t);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const raisonBlocage = dirty
    ? t("integration.save_before_test", "Enregistrez les modifications avant de tester ou synchroniser.")
    : !endpoint.actif
      ? t("integration.inactive_hint", "Synchronisation désactivée : activez-la puis enregistrez.")
      : null;

  return (
    <div className="border-t border-slate-100 first:border-t-0 dark:border-border">
      <div className="flex flex-wrap items-center gap-3 px-5 py-3.5">
        <button type="button" onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-expanded={ouvert}>
          <ChevronRight className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${ouvert ? "rotate-90" : ""}`} />
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-[14px] font-semibold text-slate-900 dark:text-foreground">{nom}</span>
              <EtatPastille etat={etat} />
            </span>
            <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[12px] text-slate-500 dark:text-muted-foreground">
              {endpoint.dernierStatut ? (
                <>
                  {t("integration.last_sync", "Dernière synchro")} : <StatutBadge statut={endpoint.dernierStatut} />
                  {endpoint.derniereSynchro && <span>{formatDateTime(endpoint.derniereSynchro)}</span>}
                </>
              ) : (
                t("integration.never_synced", "Jamais synchronisé")
              )}
            </span>
          </span>
        </button>
        <div className="flex items-center gap-2">
          <Toggle checked={endpoint.actif} onChange={(actif) => set({ actif })} label={`${t("integration.active", "Activer la synchronisation")} : ${nom}`} />
          <Button type="button" variant="outline" onClick={tester} disabled={dirty || testing || !endpoint.chemin} title={raisonBlocage || ""}>
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
            <span className="hidden sm:inline">{t("integration.test", "Tester")}</span>
          </Button>
          <Button type="button" onClick={synchroniser} disabled={dirty || syncing || !endpoint.actif} title={raisonBlocage || ""}>
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            <span className="hidden sm:inline">
              {syncing ? t("integration.sync_running", "Synchronisation en cours…") : t("integration.synchronize", "Synchroniser")}
            </span>
          </Button>
        </div>
      </div>

      {ouvert && (
        <div className="bg-slate-50/60 px-5 pb-5 pt-1 dark:bg-white/[0.02]">
          {info && (
            <p className="m-0 mb-4 flex items-start gap-2 rounded-lg bg-sky-50 px-3 py-2 text-[12.5px] text-sky-800 ring-1 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-200 dark:ring-sky-500/30">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {t(info[0], info[1])}
            </p>
          )}
          {endpoint.dernierMessage && (
            <p className="m-0 mb-4 text-[12.5px] text-slate-500 dark:text-muted-foreground">
              {t("integration.message", "Message")} : {endpoint.dernierMessage}
            </p>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Input label={t("integration.path", "Chemin")} value={endpoint.chemin} onChange={(e) => set({ chemin: e.target.value })} placeholder="/api/…" />
              <p className="m-0 mt-1 text-[11.5px] text-slate-400">{t("integration.path_hint", "Adresse appelée, ajoutée à l'URL de base.")}</p>
            </div>
            <div>
              <Input label={t("integration.list_path", "Chemin de liste")} value={endpoint.cheminListe} onChange={(e) => set({ cheminListe: e.target.value })} placeholder="data.items" />
              <p className="m-0 mt-1 text-[11.5px] text-slate-400">{t("integration.list_path_hint", "Propriété de la réponse qui contient la liste (vide si la réponse est déjà une liste).")}</p>
            </div>
          </div>

          {listeChamps.length > 0 && (
            <div className="mt-5">
              <p className="m-0 text-[12.5px] font-medium text-slate-700 dark:text-foreground">{t("integration.mapping", "Correspondance des champs")}</p>
              <p className="m-0 mb-2 text-[11.5px] text-slate-400">
                {t("integration.mapping_hint", "Pour chaque champ de la buanderie, indiquez le nom du champ dans le système externe. * obligatoire.")}
              </p>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-border dark:bg-card">
                <table className="w-full text-[13px]">
                  <thead className="bg-slate-50 text-left text-[12px] text-slate-500 dark:bg-white/5">
                    <tr>
                      <th className="px-3 py-2 font-semibold">{t("integration.local_field", "Champ buanderie")}</th>
                      <th className="w-8" aria-hidden />
                      <th className="px-3 py-2 font-semibold">{t("integration.source_field", "Champ source")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listeChamps.map((champ) => {
                      const manquant = champ === "idExterne" && endpoint.actif && !endpoint.correspondanceChamps[champ]?.trim();
                      return (
                        <tr key={champ} className="border-t border-slate-100 dark:border-border">
                          <td className="px-3 py-1.5 font-mono text-[12.5px] text-slate-700 dark:text-foreground">
                            {champ}{champ === "idExterne" && <span className="text-red-500"> *</span>}
                          </td>
                          <td className="text-center text-slate-300" aria-hidden><ArrowLeft className="inline h-3.5 w-3.5" /></td>
                          <td className="px-3 py-1.5">
                            <input
                              value={endpoint.correspondanceChamps[champ] || ""}
                              onChange={(e) => setChamp(champ, e.target.value)}
                              aria-label={`${t("integration.source_field", "Champ source")} : ${champ}`}
                              className={`h-8 w-full rounded-lg border bg-white px-2.5 font-mono text-[12.5px] focus:outline-none focus:ring-[3px] focus:ring-teal-500/12 dark:bg-card ${
                                manquant ? "border-red-400" : "border-slate-200 dark:border-border"
                              }`}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function JournalCard({ referentiels }) {
  const { t } = useTranslation();
  const { enCours } = useIntegration();
  const [filtre, setFiltre] = useState("");
  const [lignes, setLignes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rafraichir, setRafraichir] = useState(0);
  const syncing = referentiels.some(enCours);

  useEffect(() => {
    if (syncing) return;
    let actif = true;
    integrationService.getJournal(filtre || undefined)
      .then((data) => actif && setLignes(Array.isArray(data) ? data : []))
      .catch((err) => actif && toast.error(err.message))
      .finally(() => actif && setLoading(false));
    return () => { actif = false; };
  }, [filtre, syncing, rafraichir]);

  const charger = () => {
    setLoading(true);
    setRafraichir((n) => n + 1);
  };

  return (
    <SettingsCard
      icon={<History className="h-[17px] w-[17px]" />}
      title={t("integration.journal", "Journal de synchronisation")}
      description={t("integration.journal_desc", "50 dernières synchronisations.")}
    >
      <div className="mb-3 flex items-center gap-2">
        <select value={filtre} onChange={(e) => { setLoading(true); setFiltre(e.target.value); }} className={`${selectCls} max-w-[220px]`}>
          <option value="">{t("common.all", "Tous")}</option>
          {referentiels.map((r) => (
            <option key={r} value={r}>{t(`integration.referentiel.${r}`, REFERENTIEL_LABELS[r] || r)}</option>
          ))}
        </select>
        <Button type="button" variant="ghost" onClick={charger} disabled={loading}>
          <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-border">
        <table className="w-full text-[12.5px]">
          <thead className="bg-slate-50 text-left text-[12px] text-slate-500 dark:bg-white/5">
            <tr>
              <th className="px-3 py-2 font-semibold">{t("integration.date", "Date")}</th>
              <th className="px-3 py-2 font-semibold">{t("integration.referentiel_col", "Référentiel")}</th>
              <th className="px-3 py-2 font-semibold">{t("integration.status", "Statut")}</th>
              <th className="px-3 py-2 text-right font-semibold">{t("integration.nb_recus", "Reçus")}</th>
              <th className="px-3 py-2 text-right font-semibold">{t("integration.nb_crees", "Créés")}</th>
              <th className="px-3 py-2 text-right font-semibold">{t("integration.nb_mis_a_jour", "Mis à jour")}</th>
              <th className="px-3 py-2 font-semibold">{t("integration.message", "Message")}</th>
            </tr>
          </thead>
          <tbody>
            {lignes.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-slate-400">
                  {loading ? t("common.loading", "Chargement…") : t("integration.journal_empty", "Aucune synchronisation.")}
                </td>
              </tr>
            ) : (
              lignes.map((j) => (
                <tr key={j.id} className="border-t border-slate-100 dark:border-border">
                  <td className="whitespace-nowrap px-3 py-2">{formatDateTime(j.dateDebut)}</td>
                  <td className="px-3 py-2">{t(`integration.referentiel.${j.referentiel}`, REFERENTIEL_LABELS[j.referentiel] || j.referentiel)}</td>
                  <td className="px-3 py-2"><StatutBadge statut={j.statut} /></td>
                  <td className="px-3 py-2 text-right tabular-nums">{j.nbRecus ?? 0}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{j.nbCrees ?? 0}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{j.nbMisAJour ?? 0}</td>
                  <td className="max-w-[320px] truncate px-3 py-2 text-slate-500" title={j.message || ""}>{j.message || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </SettingsCard>
  );
}

export function IntegrationSection() {
  const { t } = useTranslation();
  const { integration, erreur } = useIntegration();
  const [form, setForm] = useState(null);
  const [base, setBase] = useState(null);
  const [source, setSource] = useState(null);
  const [champs, setChamps] = useState({});
  const [saving, setSaving] = useState(false);
  const [ouvert, setOuvert] = useState(null);

  if (integration && integration !== source) {
    const f = toForm(integration);
    setSource(integration);
    setBase(f);
    setForm(!form || !base || memePayload(form, base) ? f : avecStatuts(form, f));
  }

  const refs = form?.endpoints.map((e) => e.referentiel) || [];
  const refsKey = refs.join(",");

  useEffect(() => {
    if (!refsKey) return;
    refsKey.split(",").forEach((r) =>
      integrationService.getChamps(r)
        .then((liste) => setChamps((c) => ({ ...c, [r]: Array.isArray(liste) ? liste : [] })))
        .catch(() => setChamps((c) => ({ ...c, [r]: [] })))
    );
  }, [refsKey]);

  if (!form) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
        {erreur ? (
          <span className="text-red-600">{erreur}</span>
        ) : (
          <><Loader2 className="h-5 w-5 animate-spin" /> {t("common.loading", "Chargement…")}</>
        )}
      </div>
    );
  }

  const c = form.configuration;
  const dirty = !memePayload(form, base);
  const setConfig = (patch) => setForm((f) => ({ ...f, configuration: { ...f.configuration, ...patch } }));
  const setEndpoint = (e) => setForm((f) => ({ ...f, endpoints: f.endpoints.map((x) => (x.referentiel === e.referentiel ? e : x)) }));

  const appliquer = (data) => {
    const f = toForm(data);
    setSource(data);
    setBase(f);
    setForm(f);
    setIntegrationCourante(data);
  };

  const enregistrer = async () => {
    setSaving(true);
    try {
      appliquer(await integrationService.modifier(toPayload(form)));
      toast.success(t("integration.saved", "Configuration de l'intégration enregistrée."));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const appliquerModele = async () => {
    try {
      await integrationService.appliquerModele(c.typeConnecteur);
      appliquer(await integrationService.get());
      toast.success(t("integration.model_applied", "Modèle appliqué : chemins et champs mis à jour."));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const typesConnecteur = [...new Set([...TYPES_CONNECTEUR, c.typeConnecteur].filter(Boolean))];
  const auth = c.typeAuthentification || "AUCUNE";
  const externe = c.mode === "EXTERNE";
  const etats = form.endpoints.map(etatEndpoint);
  const nbPrets = etats.filter((e) => e === "PRET").length;
  const nbIncomplets = etats.filter((e) => e === "INCOMPLET").length;

  return (
    <div className="flex flex-col gap-6">
      <StepTitle
        numero={1}
        titre={t("integration.step_mode", "Source des données")}
        description={t("integration.step_mode_desc", "Où sont gérés les services, le personnel, les chambres, les linges…")}
      />
      <ModeChoix value={c.mode || "INTERNE"} onChange={(mode) => setConfig({ mode })} />

      {!externe && (
        <p className="m-0 flex items-start gap-2 rounded-xl bg-slate-50 px-4 py-3 text-[12.5px] text-slate-600 ring-1 ring-slate-200 dark:bg-white/5 dark:text-muted-foreground dark:ring-border">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {t("integration.internal_note", "En mode interne, la connexion et les référentiels ci-dessous peuvent être préparés et testés, mais rien n'est verrouillé dans la buanderie.")}
        </p>
      )}

      <StepTitle
        numero={2}
        titre={t("integration.step_connection", "Connexion au système externe")}
        description={t("integration.step_connection_desc", "Adresse et identifiants du système qui fournit les données.")}
      />
      <section className={carteCls}>
        <div className="grid grid-cols-1 gap-4 px-6 py-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <Input label={t("integration.base_url", "URL de base")} value={c.urlBase || ""} onChange={(e) => setConfig({ urlBase: e.target.value })} placeholder="https://…" />
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-[12.5px] font-medium text-slate-600 dark:text-muted-foreground">{t("integration.auth", "Authentification")}</span>
            <select value={auth} onChange={(e) => setConfig({ typeAuthentification: e.target.value })} className={selectCls}>
              {TYPES_AUTH.map((v) => <option key={v} value={v}>{t(`integration.auth_type.${v}`, AUTH_LABELS[v] || v)}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[12.5px] font-medium text-slate-600 dark:text-muted-foreground">{t("integration.connector", "Type de connecteur")}</span>
            <div className="flex gap-2">
              <select value={c.typeConnecteur || ""} onChange={(e) => setConfig({ typeConnecteur: e.target.value })} className={selectCls}>
                {typesConnecteur.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
              <Button
                type="button"
                variant="outline"
                onClick={appliquerModele}
                disabled={dirty || !c.typeConnecteur || c.typeConnecteur === "PERSONNALISE"}
                title={t("integration.apply_model_hint", "Remplit automatiquement les chemins et les champs de tous les référentiels")}
              >
                <Wand2 className="h-4 w-4" />
                <span className="hidden sm:inline">{t("integration.apply_model", "Appliquer le modèle")}</span>
              </Button>
            </div>
          </label>
          {auth === "BASIC" && (
            <>
              <Input label={t("integration.user", "Utilisateur")} value={c.utilisateur || ""} onChange={(e) => setConfig({ utilisateur: e.target.value })} autoComplete="off" />
              <Input
                type="password"
                label={t("integration.password", "Mot de passe")}
                value={c.motDePasse}
                onChange={(e) => setConfig({ motDePasse: e.target.value })}
                placeholder={c.motDePasseConfigure ? t("integration.unchanged", "•••••• (inchangé)") : ""}
                autoComplete="new-password"
              />
            </>
          )}
          {(auth === "BEARER" || auth === "CLE_API") && (
            <Input
              type="password"
              label={auth === "BEARER" ? t("integration.token", "Jeton") : t("integration.api_key", "Clé API")}
              value={c.jeton}
              onChange={(e) => setConfig({ jeton: e.target.value })}
              placeholder={c.jetonConfigure ? t("integration.unchanged", "•••••• (inchangé)") : ""}
              autoComplete="new-password"
            />
          )}
          {auth === "CLE_API" && (
            <Input label={t("integration.header_name", "Nom de l'en-tête")} value={c.nomEnteteCle || ""} onChange={(e) => setConfig({ nomEnteteCle: e.target.value })} placeholder="X-API-Key" />
          )}
        </div>
        <div className="border-t border-slate-100 px-6 py-4 dark:border-border">
          <SettingRow
            label={t("integration.auto", "Synchronisation automatique")}
            hint={t("integration.auto_hint", "Relance la synchronisation des référentiels activés à intervalle régulier.")}
          >
            <div className="flex items-center gap-3">
              {c.synchroAutomatique !== false && (
                <label className="flex items-center gap-2 text-[12.5px] text-slate-500">
                  {t("integration.every", "Toutes les")}
                  <input
                    type="number"
                    min={1}
                    value={c.frequenceMinutes ?? 60}
                    onChange={(e) => setConfig({ frequenceMinutes: e.target.value })}
                    className="h-9 w-20 rounded-[10px] border border-slate-200 px-2.5 text-[13.5px] dark:border-border dark:bg-card"
                  />
                  {t("integration.minutes", "min")}
                </label>
              )}
              <Toggle checked={c.synchroAutomatique !== false} onChange={(v) => setConfig({ synchroAutomatique: v })} label={t("integration.auto", "Synchronisation automatique")} />
            </div>
          </SettingRow>
        </div>
      </section>

      <StepTitle
        numero={3}
        titre={t("integration.step_referentiels", "Données à synchroniser")}
        description={t("integration.step_referentiels_desc", "Activez chaque référentiel fourni par le système externe, puis dépliez-le pour régler son chemin et ses champs. Ils sont synchronisés dans cet ordre.")}
      />
      <section className={carteCls}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-slate-100 px-5 py-3 text-[12.5px] text-slate-500 dark:border-border">
          <span><strong className="text-teal-700">{nbPrets}</strong> {t("integration.count_ready", "activé(s)")}</span>
          {nbIncomplets > 0 && (
            <span><strong className="text-amber-700">{nbIncomplets}</strong> {t("integration.count_incomplete", "à compléter (chemin ou idExterne manquant)")}</span>
          )}
          <span><strong>{etats.length - nbPrets - nbIncomplets}</strong> {t("integration.count_off", "géré(s) dans la buanderie")}</span>
        </div>
        {form.endpoints.map((e) => (
          <EndpointRow
            key={e.referentiel}
            endpoint={e}
            champs={champs[e.referentiel] || []}
            dirty={dirty}
            ouvert={ouvert === e.referentiel}
            onToggle={() => setOuvert((o) => (o === e.referentiel ? null : e.referentiel))}
            onChange={setEndpoint}
          />
        ))}
      </section>

      <StepTitle
        numero={4}
        titre={t("integration.step_journal", "Suivi")}
        description={t("integration.note", "Une synchronisation des linges peut durer plusieurs minutes : vous pouvez quitter cet écran, elle continue côté serveur.")}
      />
      <JournalCard referentiels={refs} />

      {dirty && (
        <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-white/95 px-5 py-3 shadow-[0_12px_32px_-12px_rgba(15,23,42,0.25)] backdrop-blur dark:border-amber-500/30 dark:bg-card/95">
          <span className="text-[13px] font-medium text-amber-700 dark:text-amber-300">
            {t("integration.unsaved", "Modifications non enregistrées : enregistrez pour pouvoir tester ou synchroniser.")}
          </span>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => setForm(base)} disabled={saving}>
              {t("common.cancel", "Annuler")}
            </Button>
            <Button type="button" onClick={enregistrer} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("common.save", "Enregistrer")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
