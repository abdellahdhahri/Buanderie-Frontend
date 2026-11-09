// pages/Reception/ReceptionList.js
import { useState, useRef, useCallback, useEffect, useContext } from "react";
import React from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import {
  User, CheckCircle, RotateCcw, Package, ShieldAlert, Wifi, Eye, EyeOff,
  Plus, LogOut, Clock, ListChecks, Loader2, Search, X,
} from "lucide-react";
import { ReceptionProvider, useReception } from "../../../contextes/ReceptionContext";
import { LingeContext } from "../../../contextes/LingeContext";
import { getSetting, bipScan } from "../../../utils/appSettings";
import { useCircuitInfecte } from "../../../hooks/useEstablishment";
import ScanInput from "../../utils/shared/ScanInput";
import { getAgent, isAgentConnected } from "../../../services/agentService";
import Swal from "sweetalert2";
import { PageHeaderIcon } from "../../Layout/PageHeaderIcon";
import LingesSansBac from "../../utils/reception/LingesSansBac";
import { getCategorieMeta } from "../../../constants/categoriesLinge";
import { BacGlyph, SacGlyph, LingeGlyph, ScannerGlyph, BadgeScanArt, EmptyBasketArt } from "./ReceptionArt";
import "./Reception.css";
import { DataTable, Code, VueSwitch, useVue } from "../../kit";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

function ReceptionInner() {
  const { t } = useTranslation();
  const circuitInfecte = useCircuitInfecte();

  const {
    agent: agentFromContext,
    bacsRecus = [],
    sacsInfectes = [],
    lingesSansBac = [],
    nouvelleReception,
    dernierRecu,
    bacEnCours,
    scanAgent,
    deconnecterAgent,
    fetchLingesDuBac,
    scanReception,
    passagePortique,
    reset,
    loading = false,
  } = useReception();

  const [scanValue, setScanValue] = useState("");
  // Mode de lecture réglé dans Paramètres › Lecture / Scan
  const { isRfidMode } = useContext(LingeContext);
  const mode = isRfidMode ? "RFID" : "BARCODE";
  const [rfidCodeBac, setRfidCodeBac] = useState("");
  const [rfidTags, setRfidTags] = useState("");
  const [rfidLoading, setRfidLoading] = useState(false);
  const [agent, setAgent] = useState(null);
  const [infecteSansBac, setInfecteSansBac] = useState(false);

  // ✅ États locaux pour l'affichage des linges/items
  const [lingesAffiches, setLingesAffiches] = useState([]);
  const [afficherPanneau, setAfficherPanneau] = useState(false);
  const [loadingPanneau, setLoadingPanneau] = useState(false);
  const [panneauType, setPanneauType] = useState(null); // "BAC" ou "SAC"
  const [panneauCode, setPanneauCode] = useState(null);

  const scanInputRef = useRef(null);
  const rfidBacRef = useRef(null);
  const rfidTagsRef = useRef(null);
  const isMounted = useRef(true);

  // ─── Récupérer l'agent depuis localStorage ─────────────────────────────
  useEffect(() => {
    const agentData = getAgent();
    if (agentData && isAgentConnected()) {
      const ag = {
        matricule: agentData.codeBarre || agentData.matricule,
        nom: agentData.nom || "Inconnu",
        prenom: agentData.prenom || "",
        nomPrenom: agentData.nomPrenom || agentData.nom || "Inconnu",
        codeBarre: agentData.codeBarre || agentData.matricule,
        id: agentData.id,
        poste: agentData.poste || "AGENT_RECEPTION",
      };
      setAgent(ag);
    } else {
      setAgent(null);
    }
  }, []);

  useEffect(() => {
    if (agentFromContext) {
      setAgent(agentFromContext);
    }
  }, [agentFromContext]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // ─── Focus automatique ─────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== "BARCODE") return;
    const keepFocus = () => {
      if (scanInputRef.current && !document.querySelector('[data-modal="true"]')) {
        scanInputRef.current.focus();
      }
    };
    const id = setInterval(keepFocus, 500);
    keepFocus();
    return () => clearInterval(id);
  }, [mode]);

  // ─── Scan auto ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== "BARCODE" || scanValue.trim().length < (Number(getSetting("scan.minLength")) || 3)) return;
    const timer = setTimeout(() => {
      bipScan();
      const code = scanValue.trim();
      setScanValue("");

      if (!agent) {
        const agentData = getAgent();
        if (agentData && isAgentConnected()) {
          const ag = {
            matricule: agentData.codeBarre || agentData.matricule,
            nom: agentData.nom || "Inconnu",
            prenom: agentData.prenom || "",
            nomPrenom: agentData.nomPrenom || agentData.nom || "Inconnu",
            codeBarre: agentData.codeBarre || agentData.matricule,
            id: agentData.id,
            poste: agentData.poste || "AGENT_RECEPTION",
          };
          setAgent(ag);
          scanReception(code, ag, { infecte: infecteSansBac });
        } else {
          scanAgent(code);
        }
      } else {
        scanReception(code, agent, { infecte: infecteSansBac });
      }
    }, Math.max(100, (Number(getSetting("scan.delayMs")) || 400) - 100)); // un peu avant le champ de scan : évite un double envoi
    return () => clearTimeout(timer);
  }, [scanValue, mode, agent, scanAgent, scanReception, infecteSansBac]);

  // ─── Soumission manuelle ───────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    const code = scanValue.trim();
    if (!code) return;
    setScanValue("");

    if (!agent) {
      const agentData = getAgent();
      if (agentData && isAgentConnected()) {
        const ag = {
          matricule: agentData.codeBarre || agentData.matricule,
          nom: agentData.nom || "Inconnu",
          prenom: agentData.prenom || "",
          nomPrenom: agentData.nomPrenom || agentData.nom || "Inconnu",
          codeBarre: agentData.codeBarre || agentData.matricule,
          id: agentData.id,
          poste: agentData.poste || "AGENT_RECEPTION",
        };
        setAgent(ag);
        scanReception(code, ag, { infecte: infecteSansBac });
      } else {
        scanAgent(code);
      }
    } else {
      scanReception(code, agent, { infecte: infecteSansBac });
    }
  };

  // ─── Portique RFID ──────────────────────────────────────────────────────
  const handlePortique = async () => {
    const tags = rfidTags
      .split(/[\s,;\n]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    if (tags.length === 0) {
      Swal.fire({
        title: t('reception_alert.rfid_no_tags'),
        text: t('reception_alert.rfid_no_tags_text'),
        icon: "warning",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }

    setRfidLoading(true);
    const result = await passagePortique(rfidCodeBac.trim(), tags, agent);
    setRfidCodeBac("");
    setRfidTags("");
    setRfidLoading(false);

    if (result?.success) {
      Swal.fire({
        title: t('reception_alert.rfid_success'),
        text: t('reception_alert.rfid_success_text', {
          count: tags.length,
          code: rfidCodeBac.trim(),
        }),
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
    } else if (result?.error) {
      Swal.fire({
        title: t('reception_alert.rfid_error'),
        text: result.message || t('reception_alert.rfid_error_text'),
        icon: "error",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  // ─── Afficher les linges d'un BAC ──────────────────────────────────────
  const handleVoirLingesBac = async () => {
    if (!bacEnCours) return;
    const bacId = bacEnCours.id || bacEnCours.bacId;
    if (!bacId) return;

    const codeBac = bacEnCours.code || bacEnCours.codeBac;

    // Si déjà ouvert sur ce bac, fermer
    if (afficherPanneau && panneauType === "BAC" && panneauCode === codeBac) {
      setAfficherPanneau(false);
      setLingesAffiches([]);
      setPanneauType(null);
      setPanneauCode(null);
      return;
    }

    setLoadingPanneau(true);
    setAfficherPanneau(true);
    setPanneauType("BAC");
    setPanneauCode(codeBac);

    // Linges présents dans le bac au moment du scan (avant réception)
    const lingesAuScan = bacEnCours.lingesAuScan || bacEnCours.linges || [];

    try {
      const linges = await fetchLingesDuBac(bacId);
      const actuels = Array.isArray(linges) ? linges : [];
      if (isMounted.current) {
        // La réception peut détacher les linges du bac : l'API renvoie alors
        // une liste vide → on affiche ceux relevés au scan
        setLingesAffiches(actuels.length > 0 ? actuels : lingesAuScan);
      }
    } catch (err) {
      console.error("❌ Erreur fetchLingesBac:", err);
      if (isMounted.current) {
        setLingesAffiches(lingesAuScan);
      }
    } finally {
      if (isMounted.current) {
        setLoadingPanneau(false);
      }
    }
  };

  // ─── Afficher les items d'un SAC INFECTÉ ──────────────────────────────
  const handleVoirItemsSac = async () => {
    if (!dernierRecu?.code) return;

    const numeroSac = dernierRecu.code;

    // Si déjà ouvert sur ce sac, fermer
    if (afficherPanneau && panneauType === "SAC" && panneauCode === numeroSac) {
      setAfficherPanneau(false);
      setLingesAffiches([]);
      setPanneauType(null);
      setPanneauCode(null);
      return;
    }

    setLoadingPanneau(true);
    setAfficherPanneau(true);
    setPanneauType("SAC");
    setPanneauCode(numeroSac);

    try {
      const res = await fetch(
        `${API_URL}/api/sacs-infectes/detail?numeroSac=${encodeURIComponent(numeroSac)}`
      );

      if (res.ok) {
        const data = await res.json();
        console.log("📦 Détails sac infecté:", data);

        const items = (data.items || []).map((item, index) => ({
          id: `sac-item-${index}`,
          categorie: item.categorie,
          quantiteDeclaree: item.quantiteDeclaree,
          quantiteComptee: item.quantiteComptee,
          ecart: item.ecart,
          isSacItem: true,
          etat: data.etat || "DECLARE",
          numeroSac: data.numeroSac,
          agentCollecteNom: data.agentCollecteNom,
          dateCollecte: data.dateCollecte,
          quantiteTotale: data.quantiteDeclaree,
        }));

        if (isMounted.current) {
          setLingesAffiches(items);
        }
      } else {
        console.error("❌ Erreur API sac:", res.status);
        if (isMounted.current) {
          setLingesAffiches([]);
        }
      }
    } catch (err) {
      console.error("❌ Erreur fetchItemsSac:", err);
      if (isMounted.current) {
        setLingesAffiches([]);
      }
    } finally {
      if (isMounted.current) {
        setLoadingPanneau(false);
      }
    }
  };

  // ─── Fermer le panneau ─────────────────────────────────────────────────
  const handleFermerPanneau = () => {
    setAfficherPanneau(false);
    setLingesAffiches([]);
    setPanneauType(null);
    setPanneauCode(null);
  };

  // ─── Reset ──────────────────────────────────────────────────────────────
  const handleReset = () => {
    setScanValue("");
    setRfidCodeBac("");
    setRfidTags("");
    setLingesAffiches([]);
    setAfficherPanneau(false);
    setPanneauType(null);
    setPanneauCode(null);
    reset();
    setTimeout(() => scanInputRef.current?.focus(), 100);
  };

  const handleNouvelleReception = () => {
    setScanValue("");
    setLingesAffiches([]);
    setAfficherPanneau(false);
    setPanneauType(null);
    setPanneauCode(null);
    setInfecteSansBac(false);
    nouvelleReception();
    setTimeout(() => scanInputRef.current?.focus(), 100);
  };

  // ─── Logout ────────────────────────────────────────────────────────────
  const handleLogout = () => {
    Swal.fire({
      title: t('reception.confirm_logout'),
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: t('reception.confirm_logout_yes'),
      cancelButtonText: t('reception.confirm_logout_no'),
      confirmButtonColor: "#0ea5e9",
    }).then((r) => {
      if (r.isConfirmed) {
        deconnecterAgent();
        setAgent(null);
        handleReset();
      }
    });
  };

  const getPlaceholder = () => {
    if (!agent) return t('reception.scan_placeholder_no_agent');
    return t('reception.scan_placeholder');
  };

  const getBorderColor = () => {
    if (!agent) return "#dc2626";
    return "#10b981";
  };

  // ─── Rendu ────────────────────────────────────────────────────────────
  const nomAgent = agent ? agent.nomPrenom || agent.nom || agent.matricule : "";
  const panneauOuvert = (type) => afficherPanneau && panneauType === type;
  const estSac = dernierRecu?.type === "SAC_INFECTE";
  const nbLingesBac = bacEnCours?.lingesAuScan?.length ?? bacEnCours?.linges?.length ?? null;

  // Journal de la session : bacs et sacs, le plus récent en premier
  const journal = [
    ...bacsRecus.map((b, i) => ({
      key: `b-${i}`,
      type: "BAC",
      code: b.codeBac || b.code || b.reference,
      n: b.nombreLinges ?? b.nbLinges ?? b.linges?.length ?? null,
      ordre: i,
    })),
    ...sacsInfectes.map((s, i) => ({
      key: `s-${i}`,
      type: "SAC",
      code: s.numeroSac || s.code,
      n: s.quantiteDeclaree ?? null,
      ordre: i,
    })),
  ].reverse();

  return (
    <div className="collecte-container rc">
      {/* ── En-tête ── */}
      <header className="page-head rc-head">
        <div className="rc-head__title">
          <PageHeaderIcon size={52} />
          <div>
            <h1>{t("reception.title")}</h1>
            <p>{agent ? t("reception.ready_barcode") : t("reception.subtitle_no_agent")}</p>
          </div>
        </div>
        <div className="rc-head__right">
          {agent && (
            <div className="rc-agent">
              <span className="rc-agent__avatar">{initiales(nomAgent)}</span>
              <span>
                <span className="rc-agent__name" style={{ display: "block" }}>{nomAgent}</span>
                <span className="rc-agent__id">{agent.codeBarre || agent.matricule}</span>
              </span>
              <button type="button" className="rc-agent__out" onClick={handleLogout} title={t("reception.logout")} aria-label={t("reception.logout")}>
                <LogOut size={14} />
              </button>
            </div>
          )}
          {agent && (
            <button type="button" className="rc-btn rc-btn--primary" onClick={handleNouvelleReception}>
              <Plus size={15} /> {t("reception.new_reception")}
            </button>
          )}
          <button type="button" className="rc-btn" onClick={handleReset}>
            <RotateCcw size={14} /> {t("reception.reset")}
          </button>
        </div>
      </header>

      {/* ── Aucun agent : accueil ── */}
      {!agent ? (
        <section className="rc-card rc-welcome">
          <BadgeScanArt />
          <div>
            <span className="rc-eyebrow">{t("reception.no_agent_title")}</span>
            <h2>{t("reception.welcome_title")}</h2>
            <p>{t("reception.no_agent_message")}</p>
            <div className="rc-scan__field" style={{ "--scan": "var(--rc-sac)" }}>
              <ScanInput
                ref={scanInputRef}
                placeholder={getPlaceholder()}
                value={scanValue}
                onChange={setScanValue}
                onSubmit={handleSubmit}
                borderColor={getBorderColor()}
                keepFocus={mode === "BARCODE"}
                autoDebounce={true}
                disabled
              />
            </div>
          </div>
        </section>
      ) : (
        <div className="rc-layout">
          {/* ═══ Colonne principale ═══ */}
          <div className="rc-main">
            {/* Zone de scan */}
            <section className="rc-card rc-scan">
              <div className="rc-scan__top">
                <ScannerGlyph />
                <div style={{ minWidth: 0 }}>
                  <h2>{t("reception.scan_title")}</h2>
                  <p>{mode === "BARCODE" ? t("reception.ready_barcode") : t("reception.ready_rfid")}</p>
                </div>
                <span className="rc-mode">
                  <i /> {mode === "BARCODE" ? t("reception.mode_barcode") : t("reception.mode_rfid")}
                </span>
              </div>

              {mode === "BARCODE" ? (
                <div className={`rc-scan__field ${infecteSansBac ? "is-infecte" : ""}`}>
                  <ScanInput
                    ref={scanInputRef}
                    placeholder={getPlaceholder()}
                    value={scanValue}
                    onChange={setScanValue}
                    onSubmit={handleSubmit}
                    borderColor={infecteSansBac ? "#e03131" : getBorderColor()}
                    keepFocus={true}
                    autoDebounce={true}
                    disabled={loading}
                  />
                </div>
              ) : (
                <div className="rc-scan__field">
                  <div className="rc-rfid">
                    <label className="rc-input">
                      <Package size={16} />
                      <input
                        type="text"
                        placeholder={t("reception.rfid_bac_code")}
                        value={rfidCodeBac}
                        onChange={(e) => setRfidCodeBac(e.target.value)}
                        ref={rfidBacRef}
                      />
                    </label>
                    <label className="rc-input">
                      <Wifi size={16} />
                      <input
                        type="text"
                        placeholder={t("reception.rfid_tags")}
                        value={rfidTags}
                        onChange={(e) => setRfidTags(e.target.value)}
                        ref={rfidTagsRef}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handlePortique();
                        }}
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    className="rc-btn rc-btn--primary"
                    style={{ width: "100%", justifyContent: "center", marginTop: 10, height: 44 }}
                    onClick={handlePortique}
                    disabled={rfidLoading || !rfidCodeBac.trim() || !rfidTags.trim()}
                  >
                    {rfidLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                    {rfidLoading ? t("reception.rfid_loading") : t("reception.rfid_validate")}
                  </button>
                </div>
              )}

              {mode === "BARCODE" && circuitInfecte && (
                <div className="rc-scan__opts">
                  <label className={`rc-toggle ${infecteSansBac ? "is-on" : ""}`} title={t("reception.infected_hint")}>
                    <input type="checkbox" checked={infecteSansBac} onChange={(e) => setInfecteSansBac(e.target.checked)} />
                    <span className="rc-toggle__track" />
                    <ShieldAlert size={15} />
                    {t("reception.infected")}
                    <small>{t("reception.infected_scope")}</small>
                  </label>
                </div>
              )}
            </section>

            {/* Dernier reçu */}
            <AnimatePresence mode="popLayout">
              {dernierRecu && dernierRecu.type !== "LINGE" && (
                <motion.section
                  key={dernierRecu.code}
                  className={`rc-card rc-spot ${estSac ? "is-sac" : ""}`}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="rc-spot__art">
                    {estSac ? <SacGlyph size={46} /> : <BacGlyph size={46} />}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <span className="rc-spot__type">
                      <CheckCircle size={12} />
                      {estSac ? t("reception.sac_infecte") : t("reception.bac")} · {t("reception.last_received")}
                    </span>
                    <code className="rc-spot__code">{dernierRecu.code}</code>
                    <div className="rc-spot__meta">
                      {estSac ? (
                        <>
                          <span><b>{dernierRecu.data?.quantiteDeclaree ?? 0}</b> {t("reception.items")}</span>
                          {dernierRecu.data?.agentCollecteNom && (
                            <span><User size={12} /> {dernierRecu.data.agentCollecteNom}</span>
                          )}
                        </>
                      ) : (
                        nbLingesBac != null && <span><b>{nbLingesBac}</b> {t("reception.linges_count")}</span>
                      )}
                      <span><Clock size={12} /> {heure(new Date())}</span>
                    </div>
                  </div>
                  {(estSac || bacEnCours) && (
                    <button
                      type="button"
                      className={`rc-btn ${panneauOuvert(estSac ? "SAC" : "BAC") ? "is-on" : ""}`}
                      onClick={estSac ? handleVoirItemsSac : handleVoirLingesBac}
                    >
                      {panneauOuvert(estSac ? "SAC" : "BAC") ? <EyeOff size={15} /> : <Eye size={15} />}
                      {estSac
                        ? panneauOuvert("SAC") ? t("reception.hide_items") : t("reception.see_items")
                        : panneauOuvert("BAC") ? t("reception.hide_linges") : t("reception.see_linges")}
                    </button>
                  )}
                </motion.section>
              )}
            </AnimatePresence>

            {/* Articles réceptionnés */}
            {afficherPanneau && (
              <ArticlesPanel
                key={`${panneauType}-${panneauCode}`}
                type={panneauType}
                code={panneauCode}
                items={lingesAffiches}
                loading={loadingPanneau}
                onClose={handleFermerPanneau}
              />
            )}

            <LingesSansBac
              linges={lingesSansBac}
              dernierCode={dernierRecu?.type === "LINGE" ? dernierRecu.code : null}
            />
          </div>

          {/* ═══ Colonne de droite ═══ */}
          <aside className="rc-side">
            <div className="rc-kpis">
              <Kpi color="var(--rc-bac)" icon={<BacGlyph size={22} c="currentColor" />} value={bacsRecus.length} label={t("reception.bacs_received")} />
              {circuitInfecte && (
                <Kpi color="var(--rc-sac)" icon={<SacGlyph size={22} c="currentColor" />} value={sacsInfectes.length} label={t("reception.sacs_infectes")} />
              )}
              <Kpi color="var(--rc-ok)" icon={<LingeGlyph size={22} c="currentColor" />} value={lingesSansBac.length} label={t("reception.linges_sans_bac")} />
              <Kpi
                color="var(--rc)"
                icon={<Clock size={17} />}
                text
                value={
                  dernierRecu
                    ? dernierRecu.type === "BAC"
                      ? t("reception.bac")
                      : dernierRecu.type === "LINGE"
                        ? t("reception.linge")
                        : t("reception.sac_infecte")
                    : "—"
                }
                label={t("reception.last_received")}
              />
            </div>

            <section className="rc-card">
              <div className="rc-card__head">
                <h3 className="rc-card__title"><ListChecks size={16} /> {t("reception.session_title")}</h3>
                <span className="rc-count" style={{ marginLeft: "auto" }}>{journal.length}</span>
              </div>
              <div className="rc-card__body">
                {journal.length === 0 ? (
                  <div className="rc-empty">
                    <EmptyBasketArt size={84} />
                    <strong>{t("reception.session_empty")}</strong>
                    <span>{t("reception.session_empty_hint")}</span>
                  </div>
                ) : (
                  <div className="rc-log">
                    {journal.map((j, i) => (
                      <motion.div
                        key={j.key}
                        layout
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`rc-log__item ${j.type === "SAC" ? "is-sac" : ""} ${i === 0 ? "is-last" : ""}`}
                      >
                        <span className="rc-log__glyph">
                          {j.type === "SAC" ? <SacGlyph size={24} /> : <BacGlyph size={24} />}
                        </span>
                        <span className="rc-log__main">
                          <code>{j.code}</code>
                          <small>{j.type === "SAC" ? t("reception.sac_infecte") : t("reception.bac")}</small>
                        </span>
                        {j.n != null && (
                          <span className="rc-log__n">
                            {j.n} {j.type === "SAC" ? t("reception.items") : t("reception.linges_count")}
                          </span>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <div className="rc-foot">
              <span>{t("reception.agent")} : <b style={{ color: "var(--rc-text)" }}>{nomAgent}</b></span>
              <span>{new Date().toLocaleDateString("fr-FR")}</span>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

/* ── Aides ─────────────────────────────────────────────────────────────── */

const initiales = (nom = "") =>
  nom.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "?";

const heure = (d) => d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

function Kpi({ color, icon, value, label, text = false }) {
  return (
    <div className="rc-kpi" style={{ "--k": color }}>
      <span className="rc-kpi__icon">{icon}</span>
      <span className={`rc-kpi__value ${text ? "rc-kpi__value--text" : ""}`}>{value}</span>
      <span className="rc-kpi__label">{label}</span>
    </div>
  );
}

/** Article d'un bac : catégorie, code, état, RFID, poids. */
function ArticleCard({ item, index }) {
  const { t } = useTranslation();
  const { Icon, accent } = getCategorieMeta(item.categorie);
  const recu = item.etat === "RECEPTION";
  return (
    <motion.div
      className="rc-item"
      style={{ "--c": accent }}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index, 12) * 0.025 }}
    >
      <span className="rc-item__icon"><Icon size={20} strokeWidth={1.9} /></span>
      <span className="rc-item__body">
        <span className="rc-item__code">{item.codeBarre || "N/A"}</span>
        <span className="rc-item__cat">
          {item.categorie ? t(`categories.${item.categorie}`, item.categorie) : t("reception.non_categorise")}
        </span>
        {item.designation && <span className="rc-item__desc">{item.designation}</span>}
        <span className="rc-item__foot">
          <span className={`rc-pill ${recu ? "rc-pill--ok" : "rc-pill--warn"}`}>
            <i /> {t(`reception_status.${item.etat}`, item.etat || "N/A")}
          </span>
          {item.rfidTag && <span className="rc-pill rc-pill--rfid">RFID</span>}
          {item.poids && <span className="rc-pill">{item.poids} {t("reception.weight")}</span>}
        </span>
      </span>
    </motion.div>
  );
}

/** Ligne d'un sac infecté : déclaré / compté / écart par catégorie. */
function SacItemCard({ item, index }) {
  const { t } = useTranslation();
  const { Icon, accent } = getCategorieMeta(item.categorie);
  const declare = Number(item.quantiteDeclaree) || 0;
  const compte = item.quantiteComptee;
  const aCompte = compte !== null && compte !== undefined;
  const ecart = item.ecart;
  const pct = declare > 0 && aCompte ? Math.min(100, (Number(compte) / declare) * 100) : 0;
  return (
    <motion.div
      className="rc-item"
      style={{ "--c": accent }}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index, 12) * 0.03 }}
    >
      <span className="rc-item__icon"><Icon size={20} strokeWidth={1.9} /></span>
      <span className="rc-item__body">
        <span className="rc-item__cat" style={{ fontSize: 13.5 }}>{t(`categories.${item.categorie}`, item.categorie)}</span>
        <span className="rc-qty">
          <span>
            <small>{t("reception.declared")}</small>
            <b>{declare}</b>
          </span>
          <span>
            <small>{t("reception.counted")}</small>
            <b>{aCompte ? compte : "—"}</b>
          </span>
        </span>
        {aCompte && <span className="rc-meter" style={{ display: "block" }}><span style={{ width: `${pct}%` }} /></span>}
        {ecart !== null && ecart !== undefined && (
          <span className="rc-item__foot">
            <span className={`rc-pill ${ecart === 0 ? "rc-pill--ok" : "rc-pill--ko"}`}>
              <i /> {t("reception.gap")} : {ecart}
            </span>
          </span>
        )}
      </span>
    </motion.div>
  );
}

/** Panneau des articles réceptionnés (linges d'un bac ou items d'un sac). */
function ArticlesPanel({ type, code, items, loading, onClose }) {
  const { t } = useTranslation();
  const [vue, setVue] = useVue("reception.articles");
  const [filtre, setFiltre] = useState("");
  const [categorie, setCategorie] = useState(null);
  const isSac = type === "SAC";

  // Répartition par catégorie (quantité déclarée pour un sac)
  const parCategorie = items.reduce((acc, it) => {
    const cat = it.categorie || "AUTRE";
    acc[cat] = (acc[cat] || 0) + (isSac ? Number(it.quantiteDeclaree) || 0 : 1);
    return acc;
  }, {});
  const total = Object.values(parCategorie).reduce((s, n) => s + n, 0);

  const q = filtre.trim().toLowerCase();
  const visibles = items.filter(
    (it) =>
      (!categorie || (it.categorie || "AUTRE") === categorie) &&
      (!q || [it.codeBarre, it.designation, it.categorie].some((v) => String(v || "").toLowerCase().includes(q)))
  );

  return (
    <motion.section
      className={`rc-card rc-articles ${isSac ? "is-sac" : ""}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="rc-card__head">
        <h3 className="rc-card__title">
          {isSac ? <SacGlyph size={22} /> : <BacGlyph size={22} />}
          {t("reception.articles_title")}
        </h3>
        {code && <code className="rc-articles__code">{code}</code>}
        <span className="rc-count">{total}</span>
        <div className="rc-articles__tools">
          <VueSwitch value={vue} onChange={setVue} compact />
          {!isSac && items.length > 6 && (
            <label className="rc-search">
              <Search size={13} />
              <input value={filtre} onChange={(e) => setFiltre(e.target.value)} placeholder={t("reception.search_article")} />
            </label>
          )}
          <button type="button" className="rc-btn rc-btn--sm" onClick={onClose}>
            <X size={13} /> {t("common.close")}
          </button>
        </div>
      </div>

      <div className="rc-card__body">
        {loading ? (
          <div className="rc-loading">
            <Loader2 size={18} className="animate-spin" /> {t("reception.loading_linges")}
          </div>
        ) : items.length === 0 ? (
          <div className="rc-empty">
            <EmptyBasketArt />
            <strong>{isSac ? t("reception.no_items") : t("reception.no_linge")}</strong>
            <span>{isSac ? t("reception.empty_sac") : t("reception.empty_bac")}</span>
          </div>
        ) : (
          <>
            <div className="rc-dist">
              <div className="rc-dist__bar" aria-hidden="true">
                {Object.entries(parCategorie).map(([cat, n]) => (
                  <span key={cat} style={{ flexGrow: n, background: getCategorieMeta(cat).accent }} />
                ))}
              </div>
              <div className="rc-chips">
                {Object.entries(parCategorie).map(([cat, n]) => (
                  <button
                    key={cat}
                    type="button"
                    className={`rc-chip ${categorie === cat ? "is-active" : ""}`}
                    style={{ "--c": getCategorieMeta(cat).accent }}
                    onClick={() => setCategorie((c) => (c === cat ? null : cat))}
                  >
                    <i /> {t(`categories.${cat}`, cat)} <b>{n}</b>
                  </button>
                ))}
              </div>
            </div>

            {visibles.length === 0 ? (
              <div className="rc-empty"><strong>{t("reception.no_match")}</strong></div>
            ) : vue === "tableau" ? (
              <DataTable
                columns={isSac ? {
                  categorie: { label: t("tri.category", "Catégorie"), render: (it) => t(`categories.${it.categorie}`, it.categorie || "—") },
                  declare: { label: t("reception.declared", "Déclaré"), render: (it) => it.quantiteDeclaree ?? "—" },
                  compte: { label: t("reception.counted", "Compté"), render: (it) => it.quantiteComptee ?? "—" },
                  ecart: { label: t("chargement.gap", "Écart"), render: (it) => it.ecart ?? "—" },
                } : {
                  code: { label: t("tri.code", "Code"), render: (it) => <Code>{it.codeBarre}</Code> },
                  categorie: { label: t("tri.category", "Catégorie"), render: (it) => (it.categorie ? t(`categories.${it.categorie}`, it.categorie) : t("reception.non_categorise")) },
                  designation: { label: t("reception.designation", "Désignation"), render: (it) => it.designation || "—" },
                  etat: { label: t("tri.status", "Statut"), render: (it) => t(`reception_status.${it.etat}`, it.etat || "—") },
                }}
                rows={visibles}
                rowKey={(it) => it.id || it.lingeId || it.codeBarre || it.categorie}
              />
            ) : (
              <div className="rc-grid">
                {visibles.map((it, i) =>
                  it.isSacItem ? (
                    <SacItemCard key={it.id || i} item={it} index={i} />
                  ) : (
                    <ArticleCard key={it.id || it.lingeId || it.codeBarre || i} item={it} index={i} />
                  )
                )}
              </div>
            )}
          </>
        )}
      </div>
    </motion.section>
  );
}

export default function ReceptionList() {
  return (
    <ReceptionProvider>
      <ReceptionInner />
    </ReceptionProvider>
  );
}