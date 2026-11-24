import React, { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { BarChart3, DoorOpen, BedDouble, Shirt, Flag, Plus, Undo2, ArrowRight, LogOut, Check } from "lucide-react";
import { getAgentFromStorage, fetchChambre, poserLinge, poserLingeChambre, retirerLingeDistribue } from "../../../services/distributionChambreService";
import MuteButton from "../../utils/MuteButton";
import { useVoiceGuide } from "../../../hooks/useVoiceGuide";
import { getSetting } from "../../../utils/appSettings";
import { useRattachementChambre } from "../../../hooks/useEstablishment";
import { ConfirmDialog, Code, QuickStats } from "../../kit";
import {
  ToolbarCollecte, EtapesCollecte, AccueilSansAgent, PosteScan, PastilleEtat,
  LigneCollecte, BoutonIcone, GroupesLignes, BilanCollecte, nomAgentCollecte,
} from "../Collecte/shared/CollecteRc";
import { getCategorieMeta } from "../../../constants/categoriesLinge";

function Resume({ res, modeChambre, onNouvelle, onTerminer }) {
  const { t } = useTranslation();
  return (
    <section className="rc-card rc-ticket">
      <div className="rc-ticket__banner">
        <Check size={16} strokeWidth={3} />
        <strong>{t("distribution_chambre.room_equipped", { code: res.codeChambre })}</strong>
      </div>
      <div className="rc-ticket__body" style={{ gridTemplateColumns: "minmax(0, 1fr) auto" }}>
        <div className="rc-ticket__main">
          <span className="rc-label">{t("distribution_chambre.room", "Chambre")}</span>
          <code className="rc-ticket__code">{res.codeChambre}</code>
          <span style={{ color: "var(--rc-muted)", fontSize: 14 }}>
            {modeChambre
              ? t("distribution_chambre.summary_room", "{{count}} linge(s) déposé(s) dans la chambre", { count: res.nbLinges })
              : `${res.nbLinges} ${t("distribution_chambre.linen")}${res.nbLinges > 1 ? "s" : ""} ${t("distribution_chambre.distributed_on")} ${res.nbLits} ${t("distribution_chambre.bed")}${res.nbLits > 1 ? "s" : ""}`}
          </span>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" className="rc-btn" onClick={onTerminer}>{t("common.finish", "Terminer")}</button>
          <button type="button" className="rc-btn rc-btn--primary rc-btn--lg" onClick={onNouvelle}><Plus size={16} /> {t("distribution_chambre.another_room", "Autre chambre")}</button>
        </div>
      </div>
      {!modeChambre && res.litsEquipes?.length > 0 && (
        <div className="cl-list">
          {res.litsEquipes.map((l) => (
            <LigneCollecte
              key={l.litId}
              icone={<BedDouble size={18} strokeWidth={2} />}
              titre={`${t("distribution_chambre.bed", "Lit")} ${l.codeLit}`}
              code={`${l.nb} ${t("distribution_chambre.distributed", "distribué(s)").toLowerCase()}`}
              etat={<PastilleEtat tone="ok">{t("distribution_chambre.completed", "Équipé")}</PastilleEtat>}
            />
          ))}
        </div>
      )}
    </section>
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
        codeScan: code,
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

  const rechargerChambre = useCallback(async () => {
    const c = chambreRef.current;
    if (!c?.codeScan) return;
    try {
      const res = await fetchChambre(c.codeScan);
      setChambre((p) => (p ? {
        ...p,
        lits: res.lits || [],
        disponibles: (res.disponibles || []).map((l) => ({ ...l, lingeId: l.lingeId || l.id })),
        dansChambre: (res.lingesDansChambre || []).map((l) => ({ ...l, lingeId: l.lingeId || l.id })),
      } : p));
      setLitActif((l) => (l ? (res.lits || []).find((x) => x.litId === l.litId) || l : l));
    } catch (e) {
      toast.error(e.message);
    }
  }, []);

  const retirer = useCallback(async (code) => {
    const c = chambreRef.current;
    if (!c || !code) return;
    setARetirer(null);
    setLoading(true);
    setScanStatus({ loading: true, code });
    try {
      const ag = agentRef.current;
      const res = await retirerLingeDistribue(code, ag?.codeBarre || ag?.matricule);
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
      const titre = res?.origine === "DISTRIBUTION"
        ? t("distribution_chambre.removed_distribution", "Linge retiré : distribution annulée")
        : res?.origine === "AFFECTATION"
          ? t("distribution_chambre.removed_assignment", "Linge retiré : affectation annulée")
          : t("distribution_chambre.linen_removed", "Linge retiré");
      const detail = [linge.codeBarre || code, ou, res?.statut ? t(`linge_status.${res.statut}`, res.statut) : null].filter(Boolean).join(" · ");
      setScanStatus({ success: { message: titre, detail } });
      setTimeout(() => setScanStatus(null), 1800);
      toast.success(titre, { description: detail });
      await rechargerChambre();
    } catch (e) {
      setScanStatus({ error: e.message });
      voice.sayErreurGenerique(e.message);
      toast.error(t("distribution_chambre.remove_refused", "Retrait refusé"), { description: e.message });
    } finally {
      setLoading(false);
    }
  }, [t, voice, rechargerChambre]);

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

  const lits = chambre?.lits || [];
  const litsEquipes = lits.filter((l) => !l.litVide).length;
  const isCloturee = etape === "RESUME";
  const litCourant = litActif ? lits.find((l) => l.litId === litActif.litId) : null;
  const lingesPosesChambre = lits.flatMap((lit) => (lit.lingesPoses || []).map((l) => ({ ...l, litId: lit.litId, codeLit: lit.codeLit })));

  const [showStats, setShowStats] = useState(false);
  const nomAgent = nomAgentCollecte(agent);

  const etapes = [
    t("distribution_chambre.step_identify", "Identification de l'agent"),
    t("distribution_chambre.room", "Chambre"),
    t("distribution_chambre.step_distribute", "Distribution"),
    t("distribution_chambre.step_close", "Clôture"),
  ];
  const faites = [
    Boolean(agent),
    Boolean(chambre),
    Boolean(chambre) && (modeChambre ? (chambre.disponibles || []).length === 0 && nbPoses > 0 : lits.length > 0 && litsEquipes === lits.length),
    isCloturee,
  ];

  const ligneLinge = (l, extra) => {
    const { Icon, accent } = getCategorieMeta(l.categorie);
    return (
      <LigneCollecte
        key={`${l.litId ?? "c"}-${l.lingeId ?? l.codeBarre}`}
        icone={<Icon size={18} strokeWidth={2} />}
        accent={accent}
        titre={l.categorie ? t(`categories.${l.categorie}`, l.categorie) : "—"}
        code={l.codeBarre}
        etat={extra}
        actions={<BoutonIcone icone={<Undo2 size={16} strokeWidth={2.4} />} titre={t("distribution_chambre.remove_yes", "Retirer")} tone="danger" disabled={loading} onClick={() => setARetirer(l)} />}
      />
    );
  };

  const ligneLit = (lit) => {
    const equipe = !lit.litVide;
    const actif = litActif?.litId === lit.litId;
    const nb = lit.lingesPoses?.length || 0;
    return (
      <LigneCollecte
        key={lit.litId}
        icone={<BedDouble size={18} strokeWidth={2} />}
        accent={equipe ? "var(--rc-ok)" : lit.estInfecte ? "var(--rc-sac)" : undefined}
        titre={`${t("distribution_chambre.bed", "Lit")} ${lit.codeLit}`}
        code={nb > 0 ? `${nb} ${t("distribution_chambre.distributed", "distribué(s)").toLowerCase()}` : t("distribution_chambre.no_linen_placed", "Aucun linge posé")}
        active={actif}
        estompe={equipe && !actif}
        onClick={() => choisirLit(lit)}
        etat={actif
          ? <PastilleEtat tone="info">{t("distribution_chambre.in_progress", "En cours")}</PastilleEtat>
          : equipe
            ? <PastilleEtat tone="ok">{t("distribution_chambre.completed", "Équipé")}</PastilleEtat>
            : lit.estInfecte
              ? <PastilleEtat tone="danger">{t("distribution_chambre.infected", "Infecté")}</PastilleEtat>
              : <PastilleEtat tone="muted">{t("distribution_chambre.empty", "À équiper")}</PastilleEtat>}
        actions={<BoutonIcone icone={actif ? <LogOut size={16} strokeWidth={2.4} /> : <ArrowRight size={17} strokeWidth={2.4} />} titre={actif ? t("common.cancel", "Annuler") : t("distribution_chambre.select_bed", "Choisir ce lit")} tone="info" onClick={(e) => { e.stopPropagation(); choisirLit(lit); }} />}
      />
    );
  };

  const groupesLits = [
    { key: "afaire", titre: t("distribution_chambre.to_equip", "À équiper"), items: lits.filter((l) => l.litVide), toujours: true },
    { key: "traites", titre: t("distribution_chambre.beds_done", "Lits équipés"), items: lits.filter((l) => !l.litVide), repliable: true, estompe: true },
  ];

  const chipsPoste = chambre ? (
    <>
      <PastilleEtat tone="info">{t("distribution_chambre.room", "Chambre")} {chambre.codeChambre}</PastilleEtat>
      {!modeChambre && litActif && <PastilleEtat tone="ok">{t("distribution_chambre.bed", "Lit")} {litActif.codeLit}</PastilleEtat>}
      {modeRetrait && <PastilleEtat tone="danger">{t("distribution_chambre.remove_linen", "Retrait")}</PastilleEtat>}
    </>
  ) : null;

  const extraToolbar = (
    <>
      <MuteButton muted={voice.muted} onToggle={voice.toggleMute} speaking={voice.speaking} lang={voiceLang} onLangChange={setVoiceLang} />
      {etape === "DISTRIBUER" && (
        <button type="button" className={`rc-btn ${modeRetrait ? "is-on" : ""}`} onClick={() => setModeRetrait((m) => !m)}>
          <Undo2 size={14} /> {modeRetrait ? t("distribution_chambre.stop_removing", "Terminer le retrait") : t("distribution_chambre.remove_linen", "Retirer un linge")}
        </button>
      )}
      <button type="button" className="rc-btn" onClick={() => setShowStats(true)}>
        <BarChart3 size={15} /> {t("common.statistics", "Statistiques")}
      </button>
      {etape === "DISTRIBUER" && (
        <button type="button" className="rc-btn rc-btn--primary" disabled={!nbPoses} onClick={demanderFin}>
          <Flag size={14} /> {t("distribution_chambre.finish_distribution_title", "Terminer la distribution")}
        </button>
      )}
    </>
  );

  return (
    <div className="collecte-container cr-page rc cc">
      <ToolbarCollecte
        agent={agent}
        extra={extraToolbar}
        onReset={etape !== "CHAMBRE" ? demanderReset : undefined}
        resetLabel={t("distribution_chambre.another_room", "Autre chambre")}
      />
      <EtapesCollecte etapes={etapes} faites={faites} label={t("distribution_chambre.steps", "Étapes de la distribution")} />

      {!agent ? (
        <AccueilSansAgent
          eyebrow={t("distribution_chambre.title")}
          titre={t("distribution_chambre.no_agent_connected")}
          scanInputRef={scanInputRef}
          value={scanVal}
          onChange={setScanVal}
          onSubmit={handleScan}
        />
      ) : isCloturee && resume ? (
        <Resume res={resume} modeChambre={modeChambre} onNouvelle={viderSession} onTerminer={viderSession} />
      ) : (
        <div className={etape === "DISTRIBUER" && chambre ? "rc-layout" : ""}>
          <div className="rc-main">
            <PosteScan
              titre={t("distribution_chambre.title")}
              chips={chipsPoste}
              infecte={modeRetrait}
              scanInputRef={scanInputRef}
              value={scanVal}
              onChange={setScanVal}
              onSubmit={handleScan}
              borderColor={modeRetrait ? "#e03131" : "#0d9488"}
              disabled={loading}
              scanStatus={scanStatus}
            />

            {etape === "DISTRIBUER" && chambre && (
              modeChambre ? (
                <section className="rc-card">
                  <div className="rc-card__head">
                    <h3 className="rc-card__title"><DoorOpen size={15} /> {t("distribution_chambre.in_room_title", "Déjà dans la chambre")}</h3>
                    <span className="rc-count">{(chambre.dansChambre || []).length}</span>
                  </div>
                  {(chambre.dansChambre || []).length === 0 ? (
                    <div className="rc-empty"><Shirt size={26} strokeWidth={1.4} /><strong>{t("distribution_chambre.room_empty", "Aucun linge dans la chambre pour le moment.")}</strong></div>
                  ) : (
                    <div className="cl-list">
                      {chambre.dansChambre.map((l) => ligneLinge(
                        l,
                        (chambre.recents || []).includes(l.lingeId)
                          ? <PastilleEtat tone="ok">{t("distribution_chambre.just_placed", "Vient d'être déposé")}</PastilleEtat>
                          : <PastilleEtat tone="muted">{t("distribution_chambre.in_room_title", "Dans la chambre")}</PastilleEtat>
                      ))}
                    </div>
                  )}
                </section>
              ) : (
                <section className="rc-card">
                  <div className="rc-card__head">
                    <h3 className="rc-card__title"><BedDouble size={15} /> {t("distribution_chambre.beds_title", "Lits de la chambre")}</h3>
                    <span className="rc-count">{lits.length}</span>
                  </div>
                  <div className="rc-card__body">
                    <GroupesLignes groupes={groupesLits} rendu={ligneLit} videMessage={t("distribution_chambre.all_equipped", "Tous les lits sont équipés")} />
                    {litCourant && (litCourant.lingesPoses || []).length > 0 && (
                      <div className="cl-sub">
                        <div className="cl-sub__title"><BedDouble size={14} /> {t("distribution_chambre.on_bed", "Sur le lit {{code}}", { code: litCourant.codeLit })}</div>
                        <div className="cl-list">{litCourant.lingesPoses.map((l) => ligneLinge({ ...l, litId: litCourant.litId }, null))}</div>
                      </div>
                    )}
                  </div>
                </section>
              )
            )}

            {etape === "DISTRIBUER" && chambre && !modeChambre && lingesPosesChambre.length > 0 && (
              <section className="rc-card">
                <div className="rc-card__head">
                  <h3 className="rc-card__title"><Shirt size={15} /> {t("distribution_chambre.room_state", "État de la chambre")}</h3>
                  <span className="rc-count">{lingesPosesChambre.length}</span>
                </div>
                <div className="cl-list">
                  {lingesPosesChambre.map((l) => ligneLinge(l, <PastilleEtat tone="info">{t("distribution_chambre.bed", "Lit")} {l.codeLit}</PastilleEtat>))}
                </div>
              </section>
            )}
          </div>

          {etape === "DISTRIBUER" && chambre && (
            <aside className="rc-side">
              <BilanCollecte
                titre={t("distribution_chambre.balance", "Bilan de la distribution")}
                progression={modeChambre ? undefined : lits.length ? Math.round((litsEquipes / lits.length) * 100) : 0}
                items={[
                  { label: t("distribution_chambre.distributed", "Distribués"), value: nbPoses },
                  ...(modeChambre
                    ? [{ label: t("distribution_chambre.in_room_title", "Dans la chambre"), value: chambre.dansChambre?.length || 0 }]
                    : [
                      { label: t("distribution_chambre.beds_done", "Lits équipés"), value: `${litsEquipes}/${lits.length}` },
                      { label: t("distribution_chambre.empty_beds", "Lits vides"), value: lits.length - litsEquipes },
                    ]),
                  { label: t("distribution_chambre.available", "Disponibles"), value: chambre.disponibles?.length || 0 },
                ]}
              />
              <div className="rc-foot">
                <span>{t("distribution_chambre.agent", "Agent")} : <b>{nomAgent}</b></span>
                <span>{new Date().toLocaleDateString("fr-FR")}</span>
              </div>
            </aside>
          )}
        </div>
      )}

      {showStats && (
        <QuickStats
          title={t("distribution_chambre.title")}
          subtitle={chambre ? `${t("distribution_chambre.room")} ${chambre.codeChambre}` : undefined}
          onClose={() => setShowStats(false)}
          kpis={[
            { label: t("distribution_chambre.distributed"), value: nbPoses, color: "#10b981" },
            ...(modeChambre
              ? [{ label: t("distribution_chambre.in_room_title", "Déjà dans la chambre"), value: chambre?.dansChambre?.length || 0, color: "#0794a4" }]
              : [
                { label: t("distribution_chambre.beds_done", "Lits équipés"), value: `${litsEquipes} / ${lits.length}`, color: "#0794a4" },
                { label: t("distribution_chambre.empty_beds"), value: lits.length - litsEquipes, color: "#f59e0b" },
              ]),
            { label: t("distribution_chambre.available", "Linges disponibles"), value: chambre?.disponibles?.length || 0, color: "#6366f1" },
          ]}
          classements={modeChambre ? [] : [{
            title: t("distribution_chambre.bed"),
            items: poses.map((p) => ({ label: p.codeLit, value: p.nb })),
          }]}
        />
      )}

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
        message={t("distribution_chambre.remove_confirm", "Retirer ce linge du lit ou de la chambre ?")}
        details={aRetirer?.codeBarre ? <Code>{aRetirer.codeBarre}</Code> : null}
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
    </div>
  );
}
