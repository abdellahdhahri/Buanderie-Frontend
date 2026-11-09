import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import {
  Scale, ScanLine, Package, Shirt, ClipboardCheck, Trash2, RotateCcw, WashingMachine, Loader2, Save, Target,
} from "lucide-react";
import {
  Page, PageHeader, DataTable, Code, Badge, VueSwitch, useVue, RowActions, RowButton, ConfirmDialog,
} from "../../kit";
import ScanInput from "../../utils/shared/ScanInput";
import { Avertissements } from "../../utils/shared/ValiderLotModal";
import { chargementService } from "../../../services/parcoursService";
import { getAgent } from "../../../services/agentService";
import "./ChargementPesee.css";

const REPERE_KG = 25;

const ETAPES = [
  { id: "lot", Icon: Package, key: "chargement.step_lot", fr: "Lot sur la balance" },
  { id: "linges", Icon: Shirt, key: "chargement.step_linens", fr: "Linges" },
  { id: "pesee", Icon: Scale, key: "chargement.step_weigh", fr: "Pesée" },
  { id: "validation", Icon: ClipboardCheck, key: "chargement.step_validate", fr: "Validation" },
];

function Balance({ poids, repere, pese }) {
  const ratio = Math.min((poids || 0) / repere, 1.25);
  const angle = -120 + ratio * 192;
  const depasse = poids > repere;
  return (
    <svg viewBox="0 0 240 190" className="cp-balance" role="img" aria-label={`${(poids || 0).toFixed(2)} kg`}>
      <defs>
        <linearGradient id="cp-plateau" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
      </defs>
      <ellipse cx="120" cy="178" rx="92" ry="7" fill="#0f172a" opacity="0.07" />
      <rect x="34" y="150" width="172" height="22" rx="10" fill="url(#cp-plateau)" />
      <rect x="44" y="142" width="152" height="12" rx="6" fill="#94a3b8" opacity="0.55" />
      <circle cx="120" cy="80" r="62" fill="#fff" stroke="#e2e8f0" strokeWidth="3" />
      <path d="M 66 111 A 62 62 0 1 1 174 111" fill="none" stroke="#e2e8f0" strokeWidth="9" strokeLinecap="round" />
      <path
        d="M 66 111 A 62 62 0 1 1 174 111"
        fill="none"
        stroke={depasse ? "#f59e0b" : "var(--teal-600, #0794a4)"}
        strokeWidth="9"
        strokeLinecap="round"
        pathLength="100"
        strokeDasharray={`${Math.min(ratio / 1.25, 1) * 100} 100`}
        style={{ transition: "stroke-dasharray .6s ease" }}
      />
      <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: "120px 80px", transition: "transform .6s cubic-bezier(.22,1,.36,1)" }}>
        <line x1="120" y1="80" x2="120" y2="34" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
      </g>
      <circle cx="120" cy="80" r="6" fill="#0f172a" />
      <rect x="84" y="96" width="72" height="26" rx="7" fill="#0f172a" />
      <text x="120" y="114" textAnchor="middle" className="cp-balance__display">{(poids || 0).toFixed(1)} kg</text>
      <text x="120" y="135" textAnchor="middle" className="cp-balance__hint">{pese ? "BALANCE" : "DÉCLARÉ"}</text>
    </svg>
  );
}

export default function ChargementPesee() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const agent = getAgent();
  const matricule = agent?.codeBarre || agent?.matricule || "";

  const [scan, setScan] = useState("");
  const [lot, setLot] = useState(null);
  const [poids, setPoids] = useState("");
  const [messages, setMessages] = useState([]);
  const [occupe, setOccupe] = useState(false);
  const [aRetirer, setARetirer] = useState(null);
  const [proposerLavage, setProposerLavage] = useState(false);
  const [vue, setVue] = useVue("chargement.linges");

  const valide = lot?.etatLot === "PRET_LAVAGE" || lot?.pretPourLavage;
  const etape = !lot ? "lot" : valide ? "validation" : lot.poidsBalance != null ? "validation" : (lot.nbLinges || 0) > 0 ? "pesee" : "linges";
  const indexEtape = ETAPES.findIndex((e) => e.id === etape);
  const codes = useMemo(() => [...(lot?.codesLinges || [])].reverse(), [lot]);

  const appliquer = (dto) => {
    setLot(dto);
    const avert = (dto?.messages || []).filter(Boolean);
    setMessages(avert);
    avert.forEach((m) => toast.warning(m));
  };

  const executer = async (action) => {
    setOccupe(true);
    try {
      return await action();
    } catch (err) {
      toast.error(err.message);
      return null;
    } finally {
      setOccupe(false);
    }
  };

  const onScan = async (code) => {
    const valeur = String(code || "").trim();
    if (!valeur || occupe) return;
    setScan("");
    if (!lot) {
      const dto = await executer(() => chargementService.getLot(valeur));
      if (!dto) return;
      if (dto.etatLot !== "EN_TRI") {
        toast.error(t("chargement.lot_not_open", "Le lot {{code}} n'est pas ouvert (état : {{etat}}).", { code: dto.codeLot || valeur, etat: t(`lot_status.${dto.etatLot}`, dto.etatLot || "—") }));
        return;
      }
      appliquer(dto);
      setPoids(dto.poidsBalance != null ? String(dto.poidsBalance) : "");
      toast.success(t("chargement.lot_ready", "Lot {{code}} prêt : scannez les linges", { code: dto.codeLot }));
      return;
    }
    if (valide) return;
    const dto = await executer(() => chargementService.scan(lot.codeLot, valeur, matricule));
    if (dto) appliquer(dto);
  };

  const enregistrerPesee = async (e) => {
    e?.preventDefault();
    if (poids === "" || Number(poids) <= 0) {
      toast.error(t("chargement.weight_required", "Saisissez le poids indiqué par la balance."));
      return;
    }
    const dto = await executer(() => chargementService.pesee(lot.codeLot, Number(poids)));
    if (dto) {
      appliquer(dto);
      toast.success(t("chargement.weight_saved", "Pesée enregistrée"));
    }
  };

  const valider = async () => {
    const dto = await executer(() => chargementService.valider(lot.codeLot, matricule, poids === "" ? null : poids));
    if (dto) {
      appliquer(dto);
      toast.success(t("chargement.validated", "Lot {{code}} prêt pour le lavage", { code: dto.codeLot }));
      setProposerLavage(true);
    }
  };

  const retirer = async () => {
    const code = aRetirer;
    setARetirer(null);
    const dto = await executer(() => chargementService.retirer(lot.codeLot, code, matricule));
    if (dto) {
      appliquer(dto);
      toast.success(t("chargement.removed", "{{code}} retiré du lot", { code }));
    }
  };

  const recommencer = () => {
    setLot(null);
    setPoids("");
    setMessages([]);
    setScan("");
  };

  const lancerLavage = (oui) => {
    setProposerLavage(false);
    if (oui) {
      navigate("/Lavages", { state: { codeLot: lot.codeLot } });
      return;
    }
    toast.info(t("chargement.waiting_wash", "Lot {{code}} en attente de lavage", { code: lot.codeLot }));
    recommencer();
  };

  const poidsAffiche = lot?.poidsBalance ?? lot?.poidsDeclare ?? 0;
  const ecart = lot?.ecartPourcent;

  const placeholder = !lot
    ? t("chargement.scan_lot", "Scannez le lot posé sur la balance")
    : valide
      ? t("chargement.lot_validated", "Lot validé")
      : t("chargement.scan_linen", "Scannez les linges un par un");

  return (
    <Page className="cp-page">
      <PageHeader
        icon={<Scale size={24} />}
        title={t("chargement.title", "Chargement (pesée)")}
        subtitle={t("chargement.subtitle", "Remplissez un lot sur la balance puis validez-le pour le lavage.")}
        right={lot && (
          <button type="button" className="cp-reset" onClick={recommencer} disabled={occupe}>
            <RotateCcw size={15} /> {t("chargement.change_lot", "Changer de lot")}
          </button>
        )}
      />

      <ol className="cp-steps">
        {ETAPES.map((e, i) => (
          <li key={e.id} className={`cp-step ${i < indexEtape || (valide && i === indexEtape) ? "is-done" : ""} ${i === indexEtape && !valide ? "is-current" : ""}`}>
            <span className="cp-step__icon"><e.Icon size={17} /></span>
            <span className="cp-step__label">{t(e.key, e.fr)}</span>
          </li>
        ))}
      </ol>

      <div className="cp-layout">
        <div className="cp-main">
          <section className="cp-card cp-scan">
            <div className="cp-card__head">
              <span className="cp-card__badge"><ScanLine size={18} /></span>
              <div>
                <h3>{!lot ? t("chargement.step_lot", "Lot sur la balance") : t("chargement.step_linens", "Linges")}</h3>
                <p>{placeholder}</p>
              </div>
              {occupe && <Loader2 size={18} className="animate-spin cp-spin" />}
            </div>
            <ScanInput
              placeholder={placeholder}
              value={scan}
              onChange={setScan}
              onSubmit={onScan}
              borderColor="#0794a4"
              keepFocus={!aRetirer && !proposerLavage && etape !== "pesee" && etape !== "validation"}
              autoDebounce
              disabled={occupe || valide}
            />
          </section>

          <section className="cp-card">
            <div className="cp-card__head">
              <span className="cp-card__badge"><Shirt size={18} /></span>
              <div>
                <h3>{t("chargement.scanned_linens", "Linges scannés")}</h3>
                <p>{lot ? <Code>{lot.codeLot}</Code> : t("chargement.no_lot", "Aucun lot sélectionné")}</p>
              </div>
              <span className="cp-count">{lot?.nbLinges || 0}</span>
              <VueSwitch value={vue} onChange={setVue} compact />
            </div>

            {!codes.length ? (
              <div className="cp-empty">
                <Shirt size={30} strokeWidth={1.5} />
                <strong>{t("chargement.empty", "Aucun linge dans ce lot")}</strong>
                <span>{t("chargement.empty_hint", "Les linges scannés apparaîtront ici.")}</span>
              </div>
            ) : vue === "tableau" ? (
              <DataTable
                columns={{
                  rang: { label: "#", render: (c) => codes.length - codes.indexOf(c) },
                  code: { label: t("tri.code", "Code"), render: (c) => <Code>{c}</Code> },
                  actions: {
                    label: t("cycles.actions", "Actions"),
                    render: (c) => (
                      <RowActions>
                        <RowButton icon={Trash2} tone="danger" title={t("chargement.remove", "Retirer du lot")} disabled={valide || occupe} onClick={() => setARetirer(c)} />
                      </RowActions>
                    ),
                  },
                }}
                rows={codes}
                rowKey={(c) => c}
              />
            ) : (
              <div className="cp-chips">
                <AnimatePresence initial={false}>
                  {codes.map((c, i) => (
                    <motion.div
                      key={c}
                      layout
                      className={`cp-chip ${i === 0 ? "is-last" : ""}`}
                      initial={{ opacity: 0, scale: 0.9, y: -6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <span className="cp-chip__n">{codes.length - i}</span>
                      <code>{c}</code>
                      {!valide && (
                        <button type="button" onClick={() => setARetirer(c)} title={t("chargement.remove", "Retirer du lot")} disabled={occupe}>
                          <Trash2 size={13} />
                        </button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </section>
        </div>

        <aside className="cp-side">
          <section className="cp-card cp-scale">
            <Balance poids={Number(poidsAffiche) || 0} repere={REPERE_KG} pese={lot?.poidsBalance != null} />
            <div className="cp-target"><Target size={13} /> {t("chargement.target", "Repère {{kg}} kg (indicatif)", { kg: REPERE_KG })}</div>
            <div className="cp-figures">
              <div><small>{t("chargement.linens", "Linges")}</small><b>{lot?.nbLinges || 0}</b></div>
              <div><small>{t("chargement.declared_weight", "Poids déclaré")}</small><b>{Number(lot?.poidsDeclare || 0).toFixed(2)} kg</b></div>
              <div><small>{t("chargement.scale", "Balance")}</small><b>{lot?.poidsBalance != null ? `${Number(lot.poidsBalance).toFixed(2)} kg` : "—"}</b></div>
              <div>
                <small>{t("chargement.gap", "Écart")}</small>
                <b className={ecart != null && Math.abs(ecart) > 20 ? "is-warn" : ""}>{ecart != null ? `${Number(ecart).toFixed(1)} %` : "—"}</b>
              </div>
            </div>
            {lot && (
              <div className="cp-tags">
                {lot.categorie && <Badge variant="info">{t(`categories.${lot.categorie}`, lot.categorie)}</Badge>}
                {lot.typeCollecte && <Badge variant={String(lot.typeCollecte).startsWith("INFECT") ? "danger" : "secondary"}>{lot.typeCollecte}</Badge>}
                <Badge variant={valide ? "success" : "warning"}>{t(`lot_status.${lot.etatLot}`, lot.etatLot)}</Badge>
              </div>
            )}
          </section>

          {lot && !valide && (
            <form className="cp-card cp-weigh" onSubmit={enregistrerPesee}>
              <label htmlFor="cp-poids">{t("chargement.scale_weight", "Poids de la balance (kg)")}</label>
              <div className="cp-weigh__row">
                <input id="cp-poids" type="number" min="0" step="0.01" value={poids} onChange={(e) => setPoids(e.target.value)} placeholder="0.00" disabled={occupe} />
                <button type="submit" className="cp-btn" disabled={occupe || !lot.nbLinges}>
                  <Save size={15} /> {t("chargement.save_weight", "Peser")}
                </button>
              </div>
              <Avertissements messages={messages} />
              <button type="button" className="cp-btn cp-btn--primary" onClick={valider} disabled={occupe || !lot.nbLinges}>
                <ClipboardCheck size={17} /> {t("chargement.validate_loading", "Valider le chargement")}
              </button>
            </form>
          )}

          {lot && valide && (
            <section className="cp-card cp-done">
              <ClipboardCheck size={26} />
              <strong>{t("chargement.validated", "Lot {{code}} prêt pour le lavage", { code: lot.codeLot })}</strong>
              <button type="button" className="cp-btn cp-btn--primary" onClick={() => lancerLavage(true)}>
                <WashingMachine size={16} /> {t("chargement.start_wash", "Lancer le lavage")}
              </button>
              <button type="button" className="cp-btn" onClick={recommencer}>{t("chargement.next_lot", "Lot suivant")}</button>
            </section>
          )}
        </aside>
      </div>

      <ConfirmDialog
        open={!!aRetirer}
        tone="danger"
        title={t("chargement.remove", "Retirer du lot")}
        message={t("chargement.remove_confirm", "Retirer le linge {{code}} du lot {{lot}} ?", { code: aRetirer, lot: lot?.codeLot })}
        confirmLabel={t("chargement.remove", "Retirer du lot")}
        onConfirm={retirer}
        onClose={() => setARetirer(null)}
      />

      <ConfirmDialog
        open={proposerLavage}
        tone="success"
        title={t("chargement.start_wash_now", "Lancer le lavage maintenant ?")}
        message={t("chargement.start_wash_text", "Le lot {{code}} est prêt. Sans lavage immédiat, il reste en attente de lavage.", { code: lot?.codeLot })}
        confirmLabel={t("chargement.start_wash", "Lancer le lavage")}
        cancelLabel={t("chargement.later", "Plus tard")}
        onConfirm={() => lancerLavage(true)}
        onClose={() => lancerLavage(false)}
      />
    </Page>
  );
}
