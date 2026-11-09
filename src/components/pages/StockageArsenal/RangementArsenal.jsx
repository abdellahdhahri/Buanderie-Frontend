import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  CircleCheck,
  Hash,
  Layers,
  ListChecks,
  Minus,
  Package,
  Plus,
  RefreshCw,
  ScanBarcode,
  TriangleAlert,
  User,
  Users,
  Warehouse,
  Undo2,
} from "lucide-react";
import AgentPicker from "./AgentPicker";
import ScanInput from "../../utils/shared/ScanInput";
import { formatDateTime } from "../../../utils/appSettings";
import {
  emplacementParam,
  fetchLingesARanger,
  fetchRemisesAgent,
  findEmplacementByCode,
  isNonConforme,
  rangerLinge,
  rangerTout,
  annulerRangement,
} from "../../../services/receptionArsenalService";
import { CategoryBar, CategoryChips, EmptyState, Loading, ScanZone, ShelfGrid } from "./arsenalUi";
import { accentOf, shelfLabel } from "./arsenalUtils";
import { Illustration, ShelfGlyph } from "./illustrations";

const ORDER = ["agent", "remises", "quantite", "etagere", "unParUn"];

// Catégories à compter pour une remise (une seule ligne « total » si le backend n'en fournit pas)
const TOTAL_KEY = "__total__";
const categoriesOf = (remise) => {
  const cats = Object.keys(remise?.parCategorie || {});
  return cats.length ? cats : [TOTAL_KEY];
};
const sumQuantites = (quantites) => Object.values(quantites).reduce((s, q) => s + (Number(q) || 0), 0);

const fade = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.18 },
};

/* ── Parcours (colonne de gauche) ───────────────────────────────────────── */

function TrackItem({ icon, label, value, meta, state, action, onAction }) {
  const { t } = useTranslation();
  return (
    <li className={`sa-track__item is-${state}`} aria-current={state === "active" ? "step" : undefined}>
      <span className="sa-track__dot">{state === "done" ? <Check size={13} strokeWidth={3} /> : icon}</span>
      <div className="sa-track__body">
        <span className="sa-track__label">{label}</span>
        {value ? (
          <span className="sa-track__value">{value}</span>
        ) : (
          <span className="sa-track__placeholder">{state === "active" ? t("stockageArsenal.in_progress") : "—"}</span>
        )}
        {meta && <span className="sa-track__meta">{meta}</span>}
      </div>
      {action && (
        <button type="button" className="sa-link" onClick={onAction}>
          {action}
        </button>
      )}
    </li>
  );
}

/* ── En-tête de l'étape (colonne de droite) ─────────────────────────────── */

function StageHead({ eyebrow, title, text, art, right, warn }) {
  return (
    <div className="sa-stage__head">
      <div style={{ minWidth: 0, flex: 1 }}>
        {eyebrow && <span className={`sa-eyebrow ${warn ? "is-warn" : ""}`}>{eyebrow}</span>}
        <h2 className="sa-stage__title">{title}</h2>
        {text && <p className="sa-stage__text">{text}</p>}
      </div>
      {right}
      {art && (
        <div className="sa-stage__art">
          <Illustration kind={art} />
        </div>
      )}
    </div>
  );
}

export default function RangementArsenal({ arsenal, emplacements }) {
  const { t } = useTranslation();

  const [step, setStep] = useState("agent");
  const [scanValue, setScanValue] = useState("");
  const [busy, setBusy] = useState(false);

  const [agent, setAgent] = useState(null); // { badge, nom, remises }
  const [agentMode, setAgentMode] = useState("scan"); // "scan" | "liste"
  const [remise, setRemise] = useState(null);
  const [quantites, setQuantites] = useState({}); // { DRAP: "3", ... } saisi par catégorie
  const [etagere, setEtagereState] = useState(null);

  // Mode un par un
  const [aRanger, setARanger] = useState(null); // réponse linges-a-ranger
  const [totalInitial, setTotalInitial] = useState(0);
  const [journal, setJournal] = useState([]);
  const [showShelves, setShowShelves] = useState(false);

  // Les scans du mode un par un sont traités en file : chaque appel voit
  // l'étagère active la plus récente, même si les scans arrivent vite.
  const etagereRef = useRef(null);
  const queueRef = useRef(Promise.resolve());
  const setEtagere = (emp) => {
    etagereRef.current = emp;
    setEtagereState(emp);
  };

  // Parcours horizontal (petits écrans) : garde l'étape en cours visible
  const trackRef = useRef(null);
  useEffect(() => {
    const list = trackRef.current;
    const active = list?.querySelector(".is-active");
    if (list && active && list.scrollWidth > list.clientWidth) {
      list.scrollTo({ left: active.offsetLeft - list.offsetLeft - 12, behavior: "smooth" });
    }
  }, [step]);

  /* ── Agent & remises ─────────────────────────────────────────────────── */

  const loadRemises = useCallback(async (badge) => {
    setBusy(true);
    try {
      const data = await fetchRemisesAgent(badge);
      setAgent({ badge, nom: data.agentNom, remises: data.remises || [] });
      setStep("remises");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }, []);

  const resetAgent = () => {
    setAgent(null);
    setRemise(null);
    setEtagere(null);
    setARanger(null);
    setStep("agent");
  };

  const backToRemises = async () => {
    setRemise(null);
    setEtagere(null);
    setARanger(null);
    setJournal([]);
    setShowShelves(false);
    if (agent) await loadRemises(agent.badge);
  };

  const selectRemise = (r) => {
    setRemise(r);
    setQuantites(Object.fromEntries(categoriesOf(r).map((c) => [c, ""])));
    setEtagere(null);
    setStep("quantite");
  };

  /* ── Quantité & étagère ──────────────────────────────────────────────── */

  const setQuantite = (categorie, value) => setQuantites((qs) => ({ ...qs, [categorie]: value }));

  const bumpQuantite = (categorie, delta) =>
    setQuantites((qs) => ({ ...qs, [categorie]: String(Math.max(0, (Number(qs[categorie]) || 0) + delta)) }));

  const quantiteTotale = sumQuantites(quantites);
  const quantitesSaisies = Object.values(quantites).every((q) => q !== "");

  const confirmQuantite = (e) => {
    e.preventDefault();
    const invalide = Object.values(quantites).some((q) => {
      const n = Number(q);
      return q === "" || !Number.isInteger(n) || n < 0;
    });
    if (invalide) {
      toast.error(t("stockageArsenal.invalid_quantity"));
      return;
    }
    setStep("etagere");
  };

  // Catégories dont la quantité comptée diffère de la quantité attendue
  const ecartsCategorie = () => {
    const attendu = remise?.parCategorie || {};
    return Object.entries(attendu)
      .filter(([cat, qte]) => Number(quantites[cat]) !== Number(qte))
      .map(([cat]) => t(`categories.${cat}`, cat));
  };

  const handleShelfScan = (code) => {
    const emp = findEmplacementByCode(emplacements, code);
    if (!emp) {
      toast.error(t("stockageArsenal.unknown_shelf", { code }));
      return;
    }
    setEtagere(emp);
  };

  const validerTout = async () => {
    if (!etagere) return;

    // Le contrôle se fait catégorie par catégorie : un écart sur l'une d'elles
    // impose le rangement un par un, même si le total correspond.
    const ecarts = ecartsCategorie();
    if (ecarts.length) {
      toast.warning(t("stockageArsenal.category_mismatch", { categories: ecarts.join(", ") }));
      await startUnParUn();
      return;
    }

    setBusy(true);
    try {
      const res = await rangerTout(remise.remiseLingeId, {
        arsenalID: arsenal.id,
        emplacement: emplacementParam(etagere),
        quantiteComptee: quantiteTotale,
        badgeAgent: agent.badge,
      });
      toast.success(res?.message || t("stockageArsenal.stored_all"));
      await backToRemises();
    } catch (e) {
      if (isNonConforme(e)) {
        toast.warning(e.message);
        await startUnParUn();
      } else {
        toast.error(e.message);
      }
    } finally {
      setBusy(false);
    }
  };

  /* ── Mode un par un ──────────────────────────────────────────────────── */

  const startUnParUn = async () => {
    // L'étagère choisie reste active ; l'agent peut en scanner une autre à tout moment
    setJournal([]);
    setStep("unParUn");
    try {
      const data = await fetchLingesARanger(remise.remiseLingeId);
      setARanger(data);
      setTotalInitial(data?.totalARanger ?? 0);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const addJournal = (entry) => setJournal((j) => [{ id: Date.now() + Math.random(), ...entry }, ...j].slice(0, 30));

  // Annule le rangement d'un linge scanné par erreur : il redevient « à ranger »
  const annulerScan = async (entry) => {
    try {
      const res = await annulerRangement(entry.code, agent?.badge);
      setJournal((j) => j.map((x) => (x.id === entry.id ? { ...x, annule: true, message: res.message } : x)));
      toast.success(res.message || t("stockageArsenal.storing_cancelled"));
      if (remise) setARanger(await fetchLingesARanger(remise.remiseLingeId));
    } catch (e) {
      toast.error(e.message);
    }
  };

  const processUnParUn = async (code) => {
    const emp = findEmplacementByCode(emplacements, code);
    if (emp) {
      setEtagere(emp);
      setShowShelves(false);
      toast.info(t("stockageArsenal.shelf_active", { shelf: shelfLabel(emp) }));
      return;
    }

    const cible = etagereRef.current;
    if (!cible) {
      toast.error(t("stockageArsenal.scan_shelf_first"));
      return;
    }

    try {
      const res = await rangerLinge(remise.remiseLingeId, {
        arsenalID: arsenal.id,
        emplacement: emplacementParam(cible),
        codeLinge: code,
        badgeAgent: agent.badge,
      });
      addJournal({ ok: true, code: res.codeBarre || code, message: res.message });

      // Mise à jour immédiate de la liste et du compteur, puis resynchronisation
      setARanger((prev) => {
        if (!prev) return prev;
        const parCategorie = { ...(prev.parCategorie || {}) };
        if (res.categorie && parCategorie[res.categorie]) {
          parCategorie[res.categorie] -= 1;
          if (parCategorie[res.categorie] <= 0) delete parCategorie[res.categorie];
        }
        return {
          ...prev,
          totalARanger: res.resteARanger ?? prev.totalARanger - 1,
          parCategorie,
          linges: (prev.linges || []).filter((l) => l.codeBarre !== res.codeBarre),
        };
      });
      if (res.resteARanger === 0) toast.success(t("stockageArsenal.remise_done"));
      else fetchLingesARanger(remise.remiseLingeId).then(setARanger).catch(() => {});
    } catch (e) {
      addJournal({ ok: false, code, message: e.message });
      toast.error(e.message);
    }
  };

  const handleUnParUnScan = (code) => {
    queueRef.current = queueRef.current.then(() => processUnParUn(code));
  };

  /* ── Rendu ───────────────────────────────────────────────────────────── */

  const at = ORDER.indexOf(step);
  const stateOf = (id) => {
    const i = ORDER.indexOf(id);
    if (i === at || (id === "etagere" && step === "unParUn")) return "active";
    return i < at ? "done" : "todo";
  };

  const rangesCount = aRanger ? Math.max(totalInitial - aRanger.totalARanger, 0) : 0;
  const remiseTerminee = aRanger?.totalARanger === 0;
  const progress = totalInitial > 0 ? (rangesCount / totalInitial) * 100 : 0;
  const stepOf = (n) => t("stockageArsenal.step_of", { n, total: 4 });

  return (
    <div className="sa-flow">
      {/* ── Parcours ─────────────────────────────────────────────────── */}
      <aside className="sa-track" aria-label={t("stockageArsenal.steps.label")}>
        <div className="sa-track__title">{t("stockageArsenal.track_title")}</div>
        <ol ref={trackRef}>
          <TrackItem
            icon={<Warehouse size={13} />}
            label={t("stockageArsenal.arsenal")}
            value={arsenal.designation}
            state="done"
          />
          <TrackItem
            icon={<User size={13} />}
            label={t("stockageArsenal.steps.agent")}
            value={agent?.nom}
            meta={agent?.badge}
            state={stateOf("agent")}
            action={agent ? t("common.edit") : null}
            onAction={resetAgent}
          />
          <TrackItem
            icon={<Package size={13} />}
            label={t("stockageArsenal.steps.remises")}
            value={remise?.numeroLivraison}
            meta={remise ? t("stockageArsenal.n_to_store", { count: remise.totalARanger }) : null}
            state={stateOf("remises")}
            action={remise ? t("common.edit") : null}
            onAction={backToRemises}
          />
          <TrackItem
            icon={<Hash size={13} />}
            label={t("stockageArsenal.steps.quantite")}
            value={at > ORDER.indexOf("quantite") ? t("stockageArsenal.n_counted", { count: quantiteTotale }) : null}
            meta={
              at > ORDER.indexOf("quantite") && !(TOTAL_KEY in quantites)
                ? Object.entries(quantites)
                    .map(([cat, q]) => `${t(`categories.${cat}`, cat)} : ${Number(q) || 0}`)
                    .join(" · ")
                : null
            }
            state={stateOf("quantite")}
            action={step === "etagere" ? t("common.edit") : null}
            onAction={() => setStep("quantite")}
          />
          <TrackItem
            icon={<Layers size={13} />}
            label={step === "unParUn" ? t("stockageArsenal.active_shelf") : t("stockageArsenal.steps.etagere")}
            value={etagere ? shelfLabel(etagere) : null}
            meta={etagere?.codeBarre}
            state={stateOf("etagere")}
          />
          {step === "unParUn" && (
            <TrackItem
              icon={<ListChecks size={13} />}
              label={t("stockageArsenal.steps.unParUn")}
              value={`${rangesCount} / ${totalInitial}`}
              meta={t("stockageArsenal.stored")}
              state={remiseTerminee ? "done" : "warn"}
            />
          )}
        </ol>
      </aside>

      {/* ── Étape en cours ───────────────────────────────────────────── */}
      <section className="sa-stage">
        <AnimatePresence mode="popLayout" initial={false}>
          {/* 1. Agent */}
          {step === "agent" && (
            <motion.div key="agent" {...fade}>
              <StageHead
                eyebrow={stepOf(1)}
                title={t("stockageArsenal.agent_title")}
                text={agentMode === "scan" ? t("stockageArsenal.scan_agent_hint") : t("stockageArsenal.pick_agent_hint")}
                art="badge"
              />
              <div className="sa-segment" role="tablist">
                <button type="button" role="tab" aria-selected={agentMode === "scan"} className={agentMode === "scan" ? "is-active" : ""} onClick={() => setAgentMode("scan")}>
                  <ScanBarcode size={15} /> {t("stockageArsenal.agent_mode_scan")}
                </button>
                <button type="button" role="tab" aria-selected={agentMode === "liste"} className={agentMode === "liste" ? "is-active" : ""} onClick={() => setAgentMode("liste")}>
                  <Users size={15} /> {t("stockageArsenal.agent_mode_list")}
                </button>
              </div>

              {/* Le champ de scan garde le focus en permanence : il n'est monté qu'en mode scan */}
              {agentMode === "scan" ? (
                <ScanZone>
                  <ScanInput
                    placeholder={t("stockageArsenal.scan_agent_placeholder")}
                    value={scanValue}
                    onChange={setScanValue}
                    onSubmit={loadRemises}
                    borderColor="#0ca678"
                    disabled={busy}
                  />
                </ScanZone>
              ) : (
                <AgentPicker onPick={loadRemises} disabled={busy} />
              )}
              {busy && <Loading />}
            </motion.div>
          )}

          {/* 2. Remises de l'agent */}
          {step === "remises" && agent && (
            <motion.div key="remises" {...fade}>
              <StageHead
                eyebrow={stepOf(2)}
                title={t("stockageArsenal.remises_title")}
                text={t("stockageArsenal.remises_hint")}
                right={
                  <button type="button" className="sa-btn sa-btn--sm" onClick={() => loadRemises(agent.badge)} disabled={busy}>
                    <RefreshCw size={14} className={busy ? "animate-spin" : ""} /> {t("common.refresh")}
                  </button>
                }
              />
              {agent.remises.length === 0 ? (
                <EmptyState art="done" title={t("stockageArsenal.no_remises")}>{t("stockageArsenal.no_remises_hint")}</EmptyState>
              ) : (
                <div className="sa-rows">
                  {agent.remises.map((r) => (
                    <button key={r.remiseLingeId} type="button" className="sa-row" onClick={() => selectRemise(r)}>
                      <span className="sa-row__main">
                        <strong>{r.numeroLivraison}</strong>
                        <small>{formatDateTime(r.dateLivraison)}</small>
                      </span>
                      <span className="sa-row__cats">
                        <CategoryBar counts={r.parCategorie} />
                        <CategoryChips counts={r.parCategorie} size="sm" />
                      </span>
                      <span className="sa-row__count">
                        <strong>{r.totalARanger}</strong>
                        <small>{t("stockageArsenal.to_store")}</small>
                      </span>
                      <ChevronRight size={18} className="sa-row__go" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* 3. Quantité comptée */}
          {step === "quantite" && remise && (
            <motion.div key="quantite" {...fade}>
              <StageHead eyebrow={stepOf(3)} title={t("stockageArsenal.quantity_title")} text={t("stockageArsenal.quantity_hint")} art="count" />
              <form onSubmit={confirmQuantite}>
                <div className="sa-qty-list">
                  {categoriesOf(remise).map((cat, i) => {
                    const label = cat === TOTAL_KEY ? t("stockageArsenal.quantity_placeholder") : t(`categories.${cat}`, cat);
                    return (
                      <div key={cat} className="sa-qty-row" style={{ "--c": accentOf(cat) }}>
                        <span className="sa-qty-row__label">
                          {cat !== TOTAL_KEY && <i className="sa-dot" />}
                          {label}
                        </span>
                        <div className="sa-qty sa-qty--sm">
                          <button type="button" className="sa-qty__btn" onClick={() => bumpQuantite(cat, -1)} aria-label="-1">
                            <Minus size={16} />
                          </button>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            inputMode="numeric"
                            autoFocus={i === 0}
                            className="sa-qty__input"
                            value={quantites[cat] ?? ""}
                            onChange={(e) => setQuantite(cat, e.target.value)}
                            placeholder="0"
                            aria-label={label}
                          />
                          <button type="button" className="sa-qty__btn" onClick={() => bumpQuantite(cat, 1)} aria-label="+1">
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {categoriesOf(remise).length > 1 && (
                    <div className="sa-qty-row sa-qty-row--total">
                      <span className="sa-qty-row__label">{t("stockageArsenal.quantity_total")}</span>
                      <strong>{quantiteTotale}</strong>
                    </div>
                  )}
                </div>
                <div className="sa-stage__foot">
                  <button type="button" className="sa-btn sa-btn--ghost" onClick={backToRemises}>
                    <ArrowLeft size={16} /> {t("stockageArsenal.back_to_remises")}
                  </button>
                  <button type="submit" className="sa-btn sa-btn--primary" disabled={!quantitesSaisies}>
                    {t("stockageArsenal.next_shelf")} <ArrowRight size={16} />
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* 4. Étagère + validation */}
          {step === "etagere" && remise && (
            <motion.div key="etagere" {...fade}>
              <StageHead eyebrow={stepOf(4)} title={t("stockageArsenal.shelf_title")} text={t("stockageArsenal.shelf_hint")} art="shelf" />
              <ScanZone>
                <ScanInput
                  placeholder={t("stockageArsenal.scan_shelf_placeholder")}
                  value={scanValue}
                  onChange={setScanValue}
                  onSubmit={handleShelfScan}
                  borderColor="#0ca678"
                  disabled={busy}
                />
              </ScanZone>

              <div className="sa-subhead">{t("stockageArsenal.or_pick_shelf")}</div>
              <ShelfGrid emplacements={emplacements} activeId={etagere?.id} onSelect={setEtagere} />

              <div className="sa-stage__foot is-sticky">
                <button type="button" className="sa-btn sa-btn--ghost" onClick={backToRemises} disabled={busy}>
                  <ArrowLeft size={16} /> {t("stockageArsenal.back_to_remises")}
                </button>
                <button type="button" className="sa-btn sa-btn--primary" onClick={validerTout} disabled={!etagere || busy}>
                  {busy ? <RefreshCw size={16} className="animate-spin" /> : <CircleCheck size={16} />}
                  {busy
                    ? t("common.saving")
                    : etagere
                      ? t("stockageArsenal.validate_into", { count: quantiteTotale, shelf: shelfLabel(etagere) })
                      : t("stockageArsenal.choose_shelf_first")}
                </button>
              </div>
            </motion.div>
          )}

          {/* 5. Rangement un par un */}
          {step === "unParUn" && remise && (
            <motion.div key="unParUn" {...fade}>
              <StageHead
                warn={!remiseTerminee}
                eyebrow={remiseTerminee ? t("stockageArsenal.remise_done") : t("stockageArsenal.one_by_one_title")}
                title={remiseTerminee ? t("stockageArsenal.remise_done") : t("stockageArsenal.scan_title_one_by_one")}
                text={remiseTerminee ? t("stockageArsenal.remise_done_hint") : t("stockageArsenal.one_by_one_intro")}
              />

              {/* Progression */}
              <div className="sa-meter">
                <div className="sa-meter__row">
                  <span>{t("stockageArsenal.progress_label", { done: rangesCount, total: totalInitial })}</span>
                  <strong>{Math.round(progress)} %</strong>
                </div>
                <div className="sa-meter__bar">
                  <span style={{ width: `${progress}%` }} />
                </div>
              </div>

              {/* Étagère active */}
              <div className={`sa-active-shelf ${etagere ? "" : "is-empty"}`}>
                <span className="sa-active-shelf__glyph">
                  <ShelfGlyph size={20} filled={etagere ? 2 : 0} />
                </span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <small>{t("stockageArsenal.active_shelf")}</small>
                  <strong>{etagere ? shelfLabel(etagere) : t("stockageArsenal.scan_shelf_first")}</strong>
                </div>
                <button type="button" className="sa-link" onClick={() => setShowShelves((s) => !s)}>
                  {showShelves ? t("common.close") : t("stockageArsenal.change_shelf")}
                </button>
              </div>

              {showShelves && (
                <div style={{ marginTop: 10 }}>
                  <ShelfGrid
                    compact
                    emplacements={emplacements}
                    activeId={etagere?.id}
                    onSelect={(emp) => {
                      setEtagere(emp);
                      setShowShelves(false);
                    }}
                  />
                </div>
              )}

              <div style={{ marginTop: 14 }}>
                <ScanZone>
                  <ScanInput
                    placeholder={etagere ? t("stockageArsenal.scan_linge_or_shelf") : t("stockageArsenal.scan_shelf_placeholder")}
                    value={scanValue}
                    onChange={setScanValue}
                    onSubmit={handleUnParUnScan}
                    borderColor={etagere ? "#0ca678" : "#f59f00"}
                    icon={<ScanBarcode size={18} />}
                  />
                </ScanZone>
              </div>

              <div className="sa-split">
                <div>
                  <div className="sa-subhead">{t("stockageArsenal.last_scans")}</div>
                  {journal.length > 0 ? (
                    <div className="sa-journal">
                      {journal.map((j) => (
                        <div key={j.id} className={`sa-journal__item ${j.annule ? "is-cancelled" : j.ok ? "is-ok" : "is-ko"}`}>
                          {j.annule ? <Undo2 size={14} /> : j.ok ? <CircleCheck size={14} /> : <TriangleAlert size={14} />}
                          <code>{j.code}</code>
                          <span style={{ flex: 1 }}>{j.message}</span>
                          {j.ok && !j.annule && (
                            <button type="button" className="sa-link sa-link--danger" onClick={() => annulerScan(j)}>
                              {t("stockageArsenal.cancel_storing")}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="sa-hint">{t("stockageArsenal.journal_empty")}</p>
                  )}
                </div>

                <div>
                  <div className="sa-subhead">
                    {t("stockageArsenal.remaining_linges")}
                    <span className="sa-count">{aRanger ? aRanger.totalARanger : "…"}</span>
                  </div>
                  {!aRanger ? (
                    <Loading />
                  ) : (aRanger.linges || []).length === 0 ? (
                    <EmptyState art="done" title={t("stockageArsenal.nothing_left")} />
                  ) : (
                    <div className="sa-list">
                      {aRanger.linges.map((l) => (
                        <div key={l.lingeId} className="sa-list__row" style={{ "--c": accentOf(l.categorie) }}>
                          <i className="sa-dot" />
                          <code>{l.codeBarre}</code>
                          <span>{l.designation || ""}</span>
                          <em>{t(`categories.${l.categorie}`, l.categorie)}</em>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="sa-stage__foot">
                <span className="sa-hint" style={{ margin: 0 }}>
                  {remiseTerminee ? "" : t("stockageArsenal.finish_hint")}
                </span>
                <button type="button" className="sa-btn sa-btn--primary" onClick={backToRemises}>
                  <CircleCheck size={16} /> {t("stockageArsenal.finish")}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
