import React, { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { DoorOpen, BedDouble, ScanLine, CheckCircle2, AlertTriangle, Loader2, Shirt, User, RotateCcw, Flag, Plus, LogOut, Info, Undo2, X } from "lucide-react";
import ScanInput from "../../utils/shared/ScanInput";
import { getAgentFromStorage, fetchChambre, poserLinge, poserLingeChambre, retirerLingeDistribue } from "../../../services/distributionChambreService";
import { PageHeaderIcon } from "../../Layout/PageHeaderIcon";
import MuteButton from "../../utils/MuteButton";
import { useVoiceGuide } from "../../../hooks/useVoiceGuide";
import { getSetting } from "../../../utils/appSettings";
import { BedTile, BedGraphic, LegendeLits } from "../Collecte/components/ChambreLits";
import { useRattachementChambre } from "../../../hooks/useEstablishment";
import {
  Page, PageHeader, ActionBar, ActionButton, ConfirmDialog, Button, DataTable, Code, Badge,
  VueSwitch, useVue, RowActions, RowButton,
} from "../../kit";
import "../Linge/WorkflowList.css";
import "./DistributionChambre.css";

const TONS_DISTRIBUTION = {
  EQUIPE: { main: "#15803D", soft: "#DCFCE7" },
  INFECTE: { main: "#DC2626", soft: "#FEE2E2" },
  A_EQUIPER: { main: "#0794A4", soft: "#E9F8FA" },
};

function CarteLit({ lit, actif, onClick }) {
  const { t } = useTranslation();
  const complet = !lit.litVide;
  const infecte = lit.estInfecte;
  const nb = lit.lingesPoses?.length || 0;
  const tone = complet
    ? { ...TONS_DISTRIBUTION.EQUIPE, label: t("distribution_chambre.completed") }
    : infecte
      ? { ...TONS_DISTRIBUTION.INFECTE, label: t("distribution_chambre.infected") }
      : { ...TONS_DISTRIBUTION.A_EQUIPER, label: t("distribution_chambre.empty") };

  return (
    <BedTile
      tone={tone}
      code={lit.codeLit}
      meta={nb > 0
        ? `${nb} ${t("distribution_chambre.linen")}${nb > 1 ? "s" : ""} ${t("distribution_chambre.distributed").toLowerCase()}`
        : t("distribution_chambre.no_linen_placed")}
      pill={actif ? t("distribution_chambre.in_progress") : tone.label}
      active={actif}
      flag={infecte && !complet}
      onClick={onClick}
    >
      <BedGraphic tone={tone} filled={complet} center={nb > 0 ? "count" : complet ? "check" : "dash"} count={nb} active={actif} />
    </BedTile>
  );
}

function Etapes({ etape, modeChambre }) {
  const { t } = useTranslation();
  const liste = [
    { id: "CHAMBRE", label: t("distribution_chambre.step_room", "Chambre"), Icon: DoorOpen },
    { id: "DISTRIBUER", label: modeChambre ? t("distribution_chambre.step_drop", "Dépôt des linges") : t("distribution_chambre.step_beds", "Équipement des lits"), Icon: modeChambre ? Shirt : BedDouble },
    { id: "RESUME", label: t("distribution_chambre.step_summary", "Récapitulatif"), Icon: Flag },
  ];
  const courant = liste.findIndex((e) => e.id === etape);
  return (
    <ol className="dc-steps">
      {liste.map((e, i) => (
        <li key={e.id} className={i < courant ? "is-done" : i === courant ? "is-current" : ""}>
          <span className="dc-steps__dot">{i < courant ? <CheckCircle2 size={15} /> : <e.Icon size={15} />}</span>
          <span className="dc-steps__label">{e.label}</span>
        </li>
      ))}
    </ol>
  );
}

function EtatScan({ status }) {
  if (!status) return null;
  if (status.loading) {
    return <div className="dc-status is-loading"><Loader2 size={15} className="animate-spin" /><span>{status.code}</span></div>;
  }
  if (status.error) {
    return <div className="dc-status is-error"><AlertTriangle size={15} /><span>{status.error}</span></div>;
  }
  if (status.success) {
    return (
      <div className="dc-status is-ok">
        <CheckCircle2 size={15} />
        <span><strong>{status.success.message}</strong>{status.success.detail ? ` · ${status.success.detail}` : ""}</span>
      </div>
    );
  }
  return null;
}

function Kpi({ icon, label, value, tone }) {
  return (
    <div className="dc-kpi" style={{ "--k": tone }}>
      <span className="dc-kpi__icon">{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function Resume({ res, modeChambre, onNouvelle, onTerminer }) {
  const { t } = useTranslation();
  return (
    <motion.div className="dc-resume" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="dc-resume__hero">
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 220, damping: 14 }}>
          <CheckCircle2 size={30} />
        </motion.span>
        <div>
          <small>{t("distribution_chambre.step_summary", "Récapitulatif")}</small>
          <h2>{t("distribution_chambre.room_equipped", { code: res.codeChambre })}</h2>
          <p>
            {modeChambre
              ? t("distribution_chambre.summary_room", "{{count}} linge(s) déposé(s) dans la chambre", { count: res.nbLinges })
              : `${res.nbLinges} ${t("distribution_chambre.linen")}${res.nbLinges > 1 ? "s" : ""} ${t("distribution_chambre.distributed_on")} ${res.nbLits} ${t("distribution_chambre.bed")}${res.nbLits > 1 ? "s" : ""}`}
          </p>
        </div>
      </div>
      {!modeChambre && res.litsEquipes?.length > 0 && (
        <DataTable
          columns={{
            lit: { label: t("distribution_chambre.bed"), render: (l) => <span className="dc-inline"><BedDouble size={15} /> <strong>{l.codeLit}</strong></span> },
            nb: { label: t("distribution_chambre.distributed"), align: "right", render: (l) => <Badge variant="success">{l.nb}</Badge> },
          }}
          rows={res.litsEquipes}
          rowKey={(l) => l.litId}
        />
      )}
      <div className="dc-resume__actions">
        <Button variant="secondary" onClick={onTerminer}>{t("common.finish")}</Button>
        <Button icon={<Plus size={16} />} onClick={onNouvelle}>{t("distribution_chambre.another_room")}</Button>
      </div>
    </motion.div>
  );
}

export default function DistributionChambre() {
  const { t } = useTranslation();
  const modeChambre = useRattachementChambre();
  const modeChambreRef = useRef(modeChambre);
  useEffect(() => { modeChambreRef.current = modeChambre; }, [modeChambre]);

  const [etape, setEtape] = useState("CHAMBRE");
  const [agent] = useState(() => getAgentFromStorage());
  const [chambre, setChambre] = useState(null);
  const [litActif, setLitActif] = useState(null);
  const [scanVal, setScanVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [resume, setResume] = useState(null);
  const [poses, setPoses] = useState([]);
  const [scanStatus, setScanStatus] = useState(() => {
    const a = getAgentFromStorage();
    return a
      ? { success: { message: `${t("distribution_chambre.agent")} ${a.nom}`, detail: `${t("distribution_chambre.connected")} · ${a.codeBarre || a.matricule}` } }
      : { error: t("distribution_chambre.no_agent_connected") };
  });
  const [confirmerFin, setConfirmerFin] = useState(false);
  const [confirmerReset, setConfirmerReset] = useState(false);
  const [modeRetrait, setModeRetrait] = useState(false);
  const [aRetirer, setARetirer] = useState(null);
  const [vueLits, setVueLits] = useVue("distribution.lits");
  const [vueChambre, setVueChambre] = useVue("distribution.chambre");

  const [voiceLang, setVoiceLang] = useState(() => getSetting("voice.lang"));
  const voice = useVoiceGuide(voiceLang);
  const voiceRef = useRef(voice);
  useEffect(() => { voiceRef.current = voice; }, [voice]);
  useEffect(() => () => voiceRef.current.cancel(), []);

  const agentRef = useRef(null);
  const chambreRef = useRef(null);
  const litRef = useRef(null);
  const scanInputRef = useRef(null);

  useEffect(() => { agentRef.current = agent; }, [agent]);
  useEffect(() => { chambreRef.current = chambre; }, [chambre]);
  useEffect(() => { litRef.current = litActif; }, [litActif]);

  useEffect(() => {
    const agentData = getAgentFromStorage();
    if (!agentData) return undefined;
    const effacer = setTimeout(() => setScanStatus(null), 2000);
    const accueil = setTimeout(() => voiceRef.current.sayBienvenueDistribution(agentData.nomPrenom || agentData.nom || ""), 600);
    return () => { clearTimeout(effacer); clearTimeout(accueil); };
  }, []);

  useEffect(() => {
    const keepFocus = () => {
      if (scanInputRef.current && !document.querySelector('[data-modal="true"], .modal-overlay')) scanInputRef.current.focus();
    };
    const id = setInterval(keepFocus, 500);
    keepFocus();
    return () => clearInterval(id);
  }, []);

  const nbPoses = poses.reduce((s, p) => s + p.nb, 0);

  const demanderFin = useCallback(() => {
    if (poses.length === 0) {
      voice.sayAucunLingeDistribue();
      toast.warning(t("distribution_chambre.no_linen_distributed_title"), { description: t("distribution_chambre.no_linen_distributed_text") });
      return;
    }
    setConfirmerFin(true);
  }, [poses, t, voice]);

  const terminer = useCallback(() => {
    setConfirmerFin(false);
    setResume({ codeChambre: chambre.codeChambre, nbLinges: nbPoses, nbLits: poses.length, litsEquipes: poses });
    setEtape("RESUME");
    setLitActif(null);
    voice.sayDistributionTerminee(chambre.codeChambre, nbPoses, poses.length);
  }, [chambre, nbPoses, poses, voice]);

  const handleChambre = useCallback(async (code) => {
    if (!agent) {
      toast.warning(t("distribution_chambre.agent_not_connected_title"), { description: t("distribution_chambre.agent_not_connected_text") });
      return;
    }
    setLoading(true);
    setScanStatus({ loading: true, code });
    try {
      const res = await fetchChambre(code);
      setChambre({
        chambreId: res.chambreId,
        codeChambre: res.codeChambre,
        lits: res.lits || [],
        disponibles: (res.disponibles || []).map((l) => ({ ...l, lingeId: l.lingeId || l.id })),
        dansChambre: (res.lingesDansChambre || []).map((l) => ({ ...l, lingeId: l.lingeId || l.id })),
        recents: [],
        session: [],
      });
      setLitActif(null);
      setPoses([]);
      setEtape("DISTRIBUER");
      const detail = modeChambreRef.current
        ? `${res.lingesDansChambre?.length || 0} ${t("distribution_chambre.in_room", "déjà dans la chambre")}`
        : `${res.lits?.length || 0} ${t("distribution_chambre.bed")}s`;
      setScanStatus({ success: { message: `${t("distribution_chambre.room")} ${res.codeChambre}`, detail } });
      setTimeout(() => setScanStatus(null), 2000);
      toast.success(`${t("distribution_chambre.room")} ${res.codeChambre}`, { description: detail });
      const nbDisponibles = res.disponibles?.length || 0;
      if (nbDisponibles === 0) voice.sayChambreDistributionVide(res.codeChambre);
      else voice.sayChambreDistribution(res.codeChambre, res.lits?.length || 0, nbDisponibles);
    } catch (e) {
      setScanStatus({ error: e.message });
      if (/réseau|network|fetch/i.test(e.message || "")) voice.sayErreurReseau();
      else voice.sayChambreErreur();
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [agent, t, voice]);

  const handleScanLingeChambre = useCallback(async (code) => {
    const c = chambreRef.current;
    if (!c) return;
    setLoading(true);
    setScanStatus({ loading: true, code });
    try {
      const res = await poserLingeChambre(c.chambreId, code);
      const linge = c.disponibles.find((l) => l.codeBarre === code || l.lingeId === res.lingeId)
        || { lingeId: res.lingeId, codeBarre: res.codeBarre, categorie: res.categorie };
      setChambre((p) => (p ? {
        ...p,
        disponibles: p.disponibles.filter((l) => l.lingeId !== linge.lingeId),
        dansChambre: [{ ...linge, codeBarre: res.codeBarre || linge.codeBarre, categorie: res.categorie || linge.categorie }, ...(p.dansChambre || []).filter((l) => l.lingeId !== linge.lingeId)],
        recents: [linge.lingeId, ...(p.recents || [])].slice(0, 3),
        session: [...(p.session || []), linge.lingeId],
      } : p));
      setPoses((p) => (p.length ? p.map((x) => ({ ...x, nb: x.nb + 1 })) : [{ litId: "CHAMBRE", codeLit: c.codeChambre, nb: 1 }]));
      setScanStatus({ success: { message: t("distribution_chambre.linen_in_room", "Linge déposé dans la chambre"), detail: res.codeBarre || code } });
      setTimeout(() => setScanStatus(null), 1500);
      if (c.disponibles.filter((l) => l.lingeId !== linge.lingeId).length === 0) voice.sayTousLingesPoses();
    } catch (e) {
      setScanStatus({ error: e.message });
      voice.sayErreurGenerique(e.message);
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [t, voice]);

  const handleScanLinge = useCallback(async (code) => {
    const lit = litRef.current;
    if (!lit) {
      voice.sayChoisirLit();
      toast.warning(t("distribution_chambre.select_bed_first_title"), { description: t("distribution_chambre.select_bed_first_text") });
      return;
    }
    setLoading(true);
    setScanStatus({ loading: true, code });
    try {
      const c = chambreRef.current;
      const res = await poserLinge(c.chambreId, lit.litId, code);
      const linge = c.disponibles.find((l) => l.codeBarre === code || l.lingeId === res.lingeId)
        || { lingeId: res.lingeId, codeBarre: res.codeBarre, categorie: res.categorie };
      setChambre((p) => (p ? {
        ...p,
        disponibles: p.disponibles.filter((l) => l.lingeId !== linge.lingeId),
        lits: p.lits.map((l) => (l.litId !== lit.litId ? l : { ...l, litVide: false, lingesPoses: [...(l.lingesPoses || []), { ...linge }] })),
        session: [...(p.session || []), linge.lingeId],
      } : p));
      setPoses((p) => {
        const ex = p.find((x) => x.litId === lit.litId);
        if (ex) return p.map((x) => (x.litId === lit.litId ? { ...x, nb: x.nb + 1 } : x));
        return [...p, { litId: lit.litId, codeLit: lit.codeLit, nb: 1 }];
      });
      setScanStatus({ success: { message: t("distribution_chambre.linen_placed"), detail: `${t("distribution_chambre.bed")} ${lit.codeLit}` } });
      setTimeout(() => setScanStatus(null), 1500);
      const restants = c.disponibles.filter((l) => l.lingeId !== linge.lingeId).length;
      const nbSurLit = (c.lits.find((l) => l.litId === lit.litId)?.lingesPoses?.length || 0) + 1;
      if (restants === 0) voice.sayTousLingesPoses();
      else voice.sayLingePose(lit.codeLit, nbSurLit);
    } catch (e) {
      setScanStatus({ error: e.message });
      voice.sayErreurGenerique(e.message);
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [t, voice]);

  const retirer = useCallback(async (code) => {
    const c = chambreRef.current;
    if (!c || !code) return;
    setARetirer(null);
    setLoading(true);
    setScanStatus({ loading: true, code });
    try {
      const res = await retirerLingeDistribue(code);
      const correspond = (l) => l && (l.codeBarre === code || l.rfidTag === code
        || (res?.lingeId != null && l.lingeId === res.lingeId)
        || (res?.codeBarre && l.codeBarre === res.codeBarre));
      const dansLit = c.lits.find((l) => (l.lingesPoses || []).some(correspond));
      const linge = (c.dansChambre || []).find(correspond)
        || dansLit?.lingesPoses.find(correspond)
        || { lingeId: res?.lingeId, codeBarre: res?.codeBarre || code, categorie: res?.categorie };
      const deCetteSession = (c.session || []).includes(linge.lingeId);
      setChambre((p) => (p ? {
        ...p,
        dansChambre: (p.dansChambre || []).filter((l) => !correspond(l)),
        lits: p.lits.map((l) => {
          const restants = (l.lingesPoses || []).filter((x) => !correspond(x));
          return restants.length === (l.lingesPoses || []).length ? l : { ...l, lingesPoses: restants, litVide: restants.length === 0 };
        }),
        disponibles: [{ ...linge }, ...p.disponibles.filter((l) => !correspond(l))],
        recents: (p.recents || []).filter((id) => id !== linge.lingeId),
        session: (p.session || []).filter((id) => id !== linge.lingeId),
      } : p));
      if (deCetteSession) {
        const cle = dansLit ? dansLit.litId : "CHAMBRE";
        setPoses((p) => p.map((x) => (x.litId === cle ? { ...x, nb: x.nb - 1 } : x)).filter((x) => x.nb > 0));
      }
      const ou = dansLit ? `${t("distribution_chambre.bed")} ${dansLit.codeLit}` : `${t("distribution_chambre.room")} ${c.codeChambre}`;
      setScanStatus({ success: { message: t("distribution_chambre.linen_removed", "Linge retiré"), detail: `${linge.codeBarre || code} · ${ou}` } });
      setTimeout(() => setScanStatus(null), 1800);
      toast.success(res?.message || t("distribution_chambre.linen_removed", "Linge retiré"), { description: `${linge.codeBarre || code} · ${ou}` });
    } catch (e) {
      setScanStatus({ error: e.message });
      voice.sayErreurGenerique(e.message);
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [t, voice]);

  const handleScan = useCallback(async (code) => {
    if (!code || loading) return;
    setScanVal("");
    if (etape === "CHAMBRE") {
      await handleChambre(code);
      return;
    }
    if (etape === "DISTRIBUER") {
      const ag = agentRef.current;
      const c = code.trim();
      if (ag && (c === ag.codeBarre || c === ag.matricule)) {
        demanderFin();
        return;
      }
      if (modeRetrait) await retirer(c);
      else if (modeChambre) await handleScanLingeChambre(c);
      else await handleScanLinge(c);
    }
  }, [etape, loading, modeChambre, modeRetrait, handleChambre, handleScanLinge, handleScanLingeChambre, demanderFin, retirer]);

  const viderSession = useCallback(() => {
    setConfirmerReset(false);
    setChambre(null);
    setLitActif(null);
    setPoses([]);
    setResume(null);
    setEtape("CHAMBRE");
    setScanVal("");
    setScanStatus(null);
    setModeRetrait(false);
    setTimeout(() => scanInputRef.current?.focus(), 200);
  }, []);

  const demanderReset = () => (etape === "DISTRIBUER" && nbPoses > 0 ? setConfirmerReset(true) : viderSession());

  const choisirLit = (lit) => {
    const dejaActif = litActif?.litId === lit.litId;
    setLitActif(dejaActif ? null : lit);
    if (!dejaActif) voice.sayLitDistribution(lit.codeLit, lit.estInfecte);
  };

  const getPlaceholder = () => {
    if (!agent) return t("distribution_chambre.agent_not_connected_placeholder");
    if (etape === "CHAMBRE") return t("distribution_chambre.scan_room_code");
    if (etape === "RESUME") return t("distribution_chambre.distribution_completed");
    if (modeRetrait) return t("distribution_chambre.scan_to_remove", "Scannez le linge à retirer");
    if (modeChambre) return t("distribution_chambre.scan_linen_to_room", { code: chambre?.codeChambre || "" });
    if (litActif) return t("distribution_chambre.scan_linen_to_bed", { code: litActif.codeLit });
    return t("distribution_chambre.select_bed_hint");
  };

  const lits = chambre?.lits || [];
  const litsEquipes = lits.filter((l) => !l.litVide).length;
  const isCloturee = etape === "RESUME";
  const pret = !!agent && !isCloturee && (etape === "CHAMBRE" || modeChambre || modeRetrait || !!litActif);
  const litCourant = litActif ? lits.find((l) => l.litId === litActif.litId) : null;

  const libelleLit = (l) => (!l.litVide
    ? <Badge variant="success">{t("distribution_chambre.completed")}</Badge>
    : l.estInfecte
      ? <Badge variant="danger">{t("distribution_chambre.infected")}</Badge>
      : <Badge variant="info">{t("distribution_chambre.empty")}</Badge>);

  return (
    <Page className="dc-page">
      <PageHeader
        icon={<PageHeaderIcon size={40} />}
        title={t("distribution_chambre.title")}
        subtitle={agent ? `${t("distribution_chambre.agent")} : ${agent.nomPrenom || agent.nom}` : t("distribution_chambre.no_agent_connected")}
        badge={chambre ? `${t("distribution_chambre.room")} ${chambre.codeChambre}` : undefined}
        right={<MuteButton muted={voice.muted} onToggle={voice.toggleMute} speaking={voice.speaking} lang={voiceLang} onLangChange={setVoiceLang} />}
      />

      <ActionBar>
        {etape === "DISTRIBUER" && (
          <ActionButton icon={<Flag size={18} />} label={t("distribution_chambre.finish_distribution_title")} variant="etat-accepter" disabled={!nbPoses} onClick={demanderFin} />
        )}
        {etape === "DISTRIBUER" && (
          <ActionButton
            icon={<Undo2 size={18} />}
            label={modeRetrait ? t("distribution_chambre.stop_removing", "Terminer le retrait") : t("distribution_chambre.remove_linen", "Retirer un linge")}
            variant={modeRetrait ? "etat-refuser" : "modifier"}
            onClick={() => setModeRetrait((m) => !m)}
          />
        )}
        {etape !== "CHAMBRE" && (
          <ActionButton icon={<DoorOpen size={18} />} label={t("distribution_chambre.another_room")} variant="details" onClick={demanderReset} />
        )}
        <ActionButton icon={<RotateCcw size={18} />} label={t("common.reset")} variant="supprimer" disabled={etape === "CHAMBRE"} onClick={demanderReset} />
      </ActionBar>

      <div className="dc-shell">
        <Etapes etape={etape} modeChambre={modeChambre} />

        {!agent && (
          <div className="dc-alert">
            <AlertTriangle size={18} />
            <div>
              <strong>{t("distribution_chambre.no_agent_connected")}</strong>
              <span>{t("distribution_chambre.no_agent_connect_text")}</span>
            </div>
          </div>
        )}

        {!isCloturee && (
          <section className={`dc-scan ${pret ? "is-ready" : ""} ${modeRetrait ? "is-retrait" : ""}`}>
            <div className="dc-scan__head">
              <span className="dc-scan__icon">{modeRetrait ? <Undo2 size={20} /> : <ScanLine size={20} />}</span>
              <div className="dc-scan__text">
                <strong>{getPlaceholder()}</strong>
                <small>
                  {modeRetrait
                    ? t("distribution_chambre.remove_hint", "Mode retrait : chaque linge scanné est retiré de son lit ou de la chambre.")
                    : etape === "DISTRIBUER"
                      ? t("distribution_chambre.scan_agent_to_close")
                      : t("distribution_chambre.to_load_beds")}
                </small>
              </div>
              {chambre && (
                <div className="dc-context">
                  <span className="kit-chip kit-chip--teal"><DoorOpen size={13} /> {chambre.codeChambre}</span>
                  {!modeChambre && litActif && <span className="kit-chip kit-chip--info"><BedDouble size={13} /> {litActif.codeLit}</span>}
                </div>
              )}
            </div>
            <ScanInput
              ref={scanInputRef}
              placeholder={getPlaceholder()}
              value={scanVal}
              onChange={setScanVal}
              onSubmit={handleScan}
              borderColor={modeRetrait ? "#dc2626" : pret ? "#0794a4" : "#cbd5e1"}
              keepFocus
              autoDebounce
              disabled={isCloturee || loading || !agent}
            />
            <EtatScan status={scanStatus} />
          </section>
        )}

        {etape === "CHAMBRE" && agent && (
          <div className="dc-empty">
            <span className="dc-empty__art"><DoorOpen size={34} /></span>
            <strong>{t("distribution_chambre.scan_room_to_load")}</strong>
            <span>{modeChambre ? t("distribution_chambre.room_mode_hint", "Les linges scannés seront déposés dans la chambre.") : t("distribution_chambre.to_load_beds")}</span>
          </div>
        )}

        {etape === "DISTRIBUER" && chambre && (
          <>
            <div className="dc-kpis">
              <Kpi icon={<CheckCircle2 size={18} />} label={t("distribution_chambre.distributed")} value={nbPoses} tone="#10b981" />
              {modeChambre ? (
                <Kpi icon={<DoorOpen size={18} />} label={t("distribution_chambre.in_room_title", "Déjà dans la chambre")} value={chambre.dansChambre?.length || 0} tone="#0794a4" />
              ) : (
                <>
                  <Kpi icon={<BedDouble size={18} />} label={t("distribution_chambre.beds_done", "Lits équipés")} value={`${litsEquipes} / ${lits.length}`} tone="#0794a4" />
                  <Kpi icon={<BedDouble size={18} />} label={t("distribution_chambre.empty_beds")} value={lits.length - litsEquipes} tone="#f59e0b" />
                </>
              )}
              <Kpi icon={<User size={18} />} label={t("distribution_chambre.agent")} value={agent?.nom || "—"} tone="#6366f1" />
            </div>

            {modeChambre ? (
              <section className="dc-panel">
                <header className="dc-panel__head">
                  <h3><DoorOpen size={16} /> {t("distribution_chambre.in_room_title", "Déjà dans la chambre")}</h3>
                  <VueSwitch value={vueChambre} onChange={setVueChambre} compact />
                </header>
                {(chambre.dansChambre || []).length === 0 ? (
                  <div className="dc-panel__empty"><Shirt size={22} /> {t("distribution_chambre.room_empty", "Aucun linge dans la chambre pour le moment.")}</div>
                ) : vueChambre === "tableau" ? (
                  <DataTable
                    columns={{
                      code: { label: t("common.code"), render: (l) => <Code>{l.codeBarre}</Code> },
                      categorie: { label: t("linge.category"), render: (l) => t(`categories.${l.categorie}`, l.categorie || "—") },
                      statut: { label: t("linge.status"), render: (l) => ((chambre.recents || []).includes(l.lingeId) ? <Badge variant="success">{t("distribution_chambre.just_placed", "Vient d'être déposé")}</Badge> : <Badge variant="secondary">{t("distribution_chambre.in_room_title", "Déjà dans la chambre")}</Badge>) },
                      actions: {
                        label: t("common.actions"),
                        align: "center",
                        render: (l) => (
                          <RowActions>
                            <RowButton icon={Undo2} tone="danger" title={t("distribution_chambre.remove_linen", "Retirer un linge")} disabled={loading} onClick={() => setARetirer(l)} />
                          </RowActions>
                        ),
                      },
                    }}
                    rows={chambre.dansChambre}
                    rowKey={(l) => l.lingeId ?? l.codeBarre}
                  />
                ) : (
                  <div className="dc-chips">
                    <AnimatePresence initial={false}>
                      {chambre.dansChambre.map((l) => (
                        <motion.span
                          key={l.lingeId ?? l.codeBarre}
                          layout
                          className={`dc-chip ${(chambre.recents || []).includes(l.lingeId) ? "is-new" : ""}`}
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.85 }}
                        >
                          <code>{l.codeBarre}</code>
                          {l.categorie && <small>{t(`categories.${l.categorie}`, l.categorie)}</small>}
                          <button type="button" className="dc-chip__remove" title={t("distribution_chambre.remove_linen", "Retirer un linge")} disabled={loading} onClick={() => setARetirer(l)}>
                            <X size={12} />
                          </button>
                        </motion.span>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </section>
            ) : (
              <section className="dc-panel">
                <header className="dc-panel__head">
                  <h3><BedDouble size={16} /> {t("distribution_chambre.beds_title", "Lits de la chambre")}</h3>
                  <VueSwitch value={vueLits} onChange={setVueLits} compact />
                </header>
                {!litActif && (
                  <div className="dc-hint"><Info size={15} /> {t("distribution_chambre.select_bed_hint")}</div>
                )}
                {litCourant && (litCourant.lingesPoses || []).length > 0 && (
                  <div className="dc-litlinges">
                    <span className="dc-litlinges__title"><BedDouble size={14} /> {t("distribution_chambre.on_bed", "Sur le lit {{code}}", { code: litCourant.codeLit })}</span>
                    <div className="dc-chips">
                      {litCourant.lingesPoses.map((l) => (
                        <span key={l.lingeId ?? l.codeBarre} className="dc-chip">
                          <code>{l.codeBarre}</code>
                          {l.categorie && <small>{t(`categories.${l.categorie}`, l.categorie)}</small>}
                          <button type="button" className="dc-chip__remove" title={t("distribution_chambre.remove_linen", "Retirer un linge")} disabled={loading} onClick={() => setARetirer(l)}>
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {vueLits === "tableau" ? (
                  <DataTable
                    columns={{
                      lit: { label: t("distribution_chambre.bed"), render: (l) => <span className="dc-inline"><BedDouble size={15} /> <strong>{l.codeLit}</strong></span> },
                      etat: { label: t("linge.status"), render: libelleLit },
                      nb: { label: t("distribution_chambre.distributed"), align: "right", render: (l) => l.lingesPoses?.length || 0 },
                      actions: {
                        label: t("common.actions"),
                        align: "center",
                        render: (l) => (
                          <RowActions>
                            <RowButton icon={litActif?.litId === l.litId ? LogOut : ScanLine} title={litActif?.litId === l.litId ? t("common.cancel") : t("distribution_chambre.select_bed_hint")} onClick={() => choisirLit(l)} />
                          </RowActions>
                        ),
                      },
                    }}
                    rows={lits}
                    rowKey={(l) => l.litId}
                    activeId={litActif?.litId}
                    onRowClick={choisirLit}
                  />
                ) : (
                  <>
                    <LegendeLits items={[
                      { ...TONS_DISTRIBUTION.A_EQUIPER, label: t("distribution_chambre.empty") },
                      { ...TONS_DISTRIBUTION.INFECTE, label: t("distribution_chambre.infected") },
                      { ...TONS_DISTRIBUTION.EQUIPE, label: t("distribution_chambre.completed") },
                    ]} />
                    <div className="lits-grid">
                      {lits.map((lit) => (
                        <CarteLit key={lit.litId} lit={lit} actif={litActif?.litId === lit.litId} onClick={() => choisirLit(lit)} />
                      ))}
                    </div>
                  </>
                )}
              </section>
            )}
          </>
        )}

        {isCloturee && resume && (
          <Resume res={resume} modeChambre={modeChambre} onNouvelle={viderSession} onTerminer={viderSession} />
        )}
      </div>

      <ConfirmDialog
        open={confirmerFin}
        tone="success"
        title={t("distribution_chambre.finish_distribution_title")}
        message={modeChambre
          ? t("distribution_chambre.finish_room_text", { count: nbPoses, code: chambre?.codeChambre })
          : t("distribution_chambre.finish_distribution_text", { count: nbPoses, beds: poses.length })}
        confirmLabel={t("distribution_chambre.yes_finish")}
        cancelLabel={t("common.cancel")}
        onConfirm={terminer}
        onClose={() => setConfirmerFin(false)}
      />
      <ConfirmDialog
        open={!!aRetirer}
        title={t("distribution_chambre.remove_linen", "Retirer un linge")}
        message={t("distribution_chambre.remove_confirm", "Retirer le linge {{code}} ? Il redevient disponible à la distribution.", { code: aRetirer?.codeBarre || "" })}
        confirmLabel={t("distribution_chambre.remove_yes", "Retirer")}
        cancelLabel={t("common.cancel")}
        busy={loading}
        onConfirm={() => retirer(aRetirer?.codeBarre)}
        onClose={() => setARetirer(null)}
      />
      <ConfirmDialog
        open={confirmerReset}
        title={t("distribution_chambre.reset_title")}
        message={t("distribution_chambre.reset_text")}
        confirmLabel={t("distribution_chambre.yes_reset")}
        cancelLabel={t("common.cancel")}
        onConfirm={viderSession}
        onClose={() => setConfirmerReset(false)}
      />
    </Page>
  );
}
