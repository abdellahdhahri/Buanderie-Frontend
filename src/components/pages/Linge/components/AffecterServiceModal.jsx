import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Building2, ScanLine, Filter, ArrowRight, Trash2, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Modal, Button, FormField, SelectRecherche, Tabs, DataTable, Code, Badge, RowActions, RowButton } from "../../../kit";
import { lireErreur } from "../../../../services/integrationService";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";
const PARALLELE = 4;

const decouper = (texte) => String(texte || "").split(/[\s,;]+/).map((c) => c.trim()).filter(Boolean);
const codeDe = (l) => l.codebarre ?? l.codeBarre ?? `#${l.id}`;

const affecter = async (linge, serviceId, fallback) => {
  const res = await fetch(`${API_URL}/api/linges/${linge.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      categorie: linge.categorie,
      poids: Number(linge.poids) || 0,
      serviceId,
      etat: linge.etat,
      durevie: linge.dureVie ?? linge.durevie ?? null,
      porteurId: linge.porteurId ?? null,
      rfidTag: linge.rfidTag || null,
      observations: linge.observations || null,
      groupeLavage: linge.groupeLavage || null,
    }),
  });
  if (!res.ok) throw new Error(await lireErreur(res, fallback));
  return res.json();
};

export function AffecterServiceModal({ isOpen, onClose, onDone, services, getServiceName, getLingeByCode, chargerFiltres, filterChips = [], initialLinges = [] }) {
  const { t } = useTranslation();
  const [cible, setCible] = useState("");
  const [source, setSource] = useState("scan");
  const [saisie, setSaisie] = useState("");
  const [linges, setLinges] = useState([]);
  const [recherche, setRecherche] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [progression, setProgression] = useState(null);
  const [resultat, setResultat] = useState(null);
  const inputRef = useRef(null);
  const initialRef = useRef(initialLinges);
  initialRef.current = initialLinges;

  useEffect(() => {
    if (!isOpen) return;
    setCible("");
    setSource("scan");
    setSaisie("");
    setLinges((initialRef.current || []).filter(Boolean));
    setProgression(null);
    setResultat(null);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && source === "scan") {
      const id = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(id);
    }
  }, [isOpen, source]);

  const cibleId = cible ? Number(cible) : null;
  const aChanger = useMemo(() => linges.filter((l) => l.serviceId !== cibleId), [linges, cibleId]);
  const enCours = progression != null && !resultat;

  if (!isOpen) return null;

  const ajouterCodes = async (texte) => {
    const codes = decouper(texte).filter((c) => !linges.some((l) => codeDe(l) === c));
    setSaisie("");
    if (!codes.length) return;
    setRecherche(true);
    const trouves = [];
    const introuvables = [];
    for (const code of codes) {
      const l = await getLingeByCode(code);
      if (l?.id) trouves.push({ ...l, codebarre: l.codebarre ?? l.codeBarre ?? code });
      else introuvables.push(code);
    }
    setRecherche(false);
    if (trouves.length) setLinges((prev) => [...prev, ...trouves.filter((x) => !prev.some((p) => p.id === x.id))]);
    if (introuvables.length) toast.error(t("linge.assign.not_found", "Linge introuvable"), { description: introuvables.join(", ") });
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const chargerDepuisFiltres = async () => {
    setChargement(true);
    try {
      const tous = await chargerFiltres();
      setLinges(tous);
      if (!tous.length) toast.info(t("linge.export.empty", "Aucun linge avec ces filtres."));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setChargement(false);
    }
  };

  const lancer = async () => {
    if (!cibleId || !aChanger.length) return;
    const file = [...aChanger];
    const echecs = [];
    let ok = 0;
    setProgression(0);
    const travailleur = async () => {
      while (file.length) {
        const l = file.shift();
        try {
          await affecter(l, cibleId, t("linge.error_operation"));
          ok += 1;
        } catch (e) {
          echecs.push({ code: codeDe(l), message: e.message });
        }
        setProgression((p) => (p ?? 0) + 1);
      }
    };
    await Promise.all(Array.from({ length: Math.min(PARALLELE, file.length) }, travailleur));
    setResultat({ ok, echecs });
    if (ok) {
      toast.success(t("linge.assign.success", "{{count}} linge(s) affecté(s) à {{service}}", { count: ok, service: getServiceName(cibleId) }));
      onDone?.();
    }
    if (echecs.length) toast.error(t("linge.assign.partial", "{{count}} échec(s)", { count: echecs.length }));
  };

  const pct = aChanger.length ? Math.round(((progression || 0) / aChanger.length) * 100) : 0;

  const colonnes = {
    code: { label: t("linge.code", "Code"), render: (l) => <Code>{codeDe(l)}</Code> },
    categorie: { label: t("linge.category", "Catégorie"), render: (l) => t(`categories.${l.categorie}`, l.categorie || "—") },
    transfert: {
      label: t("linge.assign.transfer", "Affectation"),
      render: (l) => (
        <span className="lsa-transfer">
          <span className="kit-muted">{getServiceName(l.serviceId)}</span>
          <ArrowRight size={14} />
          {cibleId
            ? l.serviceId === cibleId
              ? <Badge variant="secondary">{t("linge.assign.already", "Déjà affecté")}</Badge>
              : <Badge variant="info">{getServiceName(cibleId)}</Badge>
            : <span className="kit-muted">?</span>}
        </span>
      ),
    },
    actions: {
      label: t("common.actions"),
      render: (l) => (
        <RowActions>
          <RowButton icon={Trash2} tone="danger" title={t("common.delete")} disabled={enCours} onClick={() => setLinges((prev) => prev.filter((x) => x.id !== l.id))} />
        </RowActions>
      ),
    },
  };

  const footer = resultat ? (
    <Button onClick={onClose}>{t("common.close", "Fermer")}</Button>
  ) : (
    <>
      <Button variant="secondary" onClick={onClose} disabled={enCours}>{t("common.cancel", "Annuler")}</Button>
      <Button icon={enCours ? <Loader2 size={16} className="animate-spin" /> : <Building2 size={16} />} onClick={lancer} disabled={!cibleId || !aChanger.length || enCours}>
        {t("linge.assign.submit", "Affecter {{count}} linge(s)", { count: aChanger.length })}
      </Button>
    </>
  );

  return (
    <Modal
      open
      size="lg"
      icon={<Building2 size={20} />}
      title={t("linge.assign.title", "Affecter des linges à un service")}
      subtitle={t("linge.assign.subtitle", "Choisissez le service puis les linges concernés")}
      onClose={enCours ? undefined : onClose}
      closeOnOverlay={!enCours}
      footer={footer}
    >
      {resultat ? (
        <div className="lsa-result">
          <motion.div className="lsa-result__hero" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <span className={resultat.echecs.length ? "is-warn" : "is-ok"}>
              {resultat.echecs.length ? <XCircle size={30} /> : <CheckCircle2 size={30} />}
            </span>
            <div>
              <strong>{t("linge.assign.done", "Affectation terminée")}</strong>
              <small>{getServiceName(cibleId)}</small>
            </div>
          </motion.div>
          <div className="lsa-result__grid">
            <div className="kit-seg" style={{ "--z": "#10b981" }}><span><i />{t("linge.assign.ok", "Affectés")}</span><strong>{resultat.ok}</strong></div>
            <div className="kit-seg" style={{ "--z": "#ef4444" }}><span><i />{t("linge.assign.failed", "Échecs")}</span><strong>{resultat.echecs.length}</strong></div>
            <div className="kit-seg" style={{ "--z": "#64748b" }}><span><i />{t("linge.assign.skipped", "Déjà dans ce service")}</span><strong>{linges.length - aChanger.length}</strong></div>
          </div>
          {resultat.echecs.length > 0 && (
            <DataTable
              columns={{
                code: { label: t("linge.code", "Code"), render: (e) => <Code>{e.code}</Code> },
                message: { label: t("common.error"), render: (e) => e.message },
              }}
              rows={resultat.echecs}
              rowKey={(e) => e.code}
            />
          )}
        </div>
      ) : (
        <div className="lsa">
          <div className="kit-form-section">
            <strong>1 · {t("linge.assign.step_service", "Service de destination")}</strong>
            <small>{t("linge.assign.step_service_hint", "Le service qui recevra les linges")}</small>
          </div>
          <FormField label={t("linge.service")} required>
            <SelectRecherche value={cible} onChange={(e) => setCible(e.target.value)} placeholder={t("linge.select_service")} disabled={enCours}>
              <option value="">{t("linge.select_service")}</option>
              {services.map((s) => <option key={s.id} value={s.id}>{[s.code, s.nom || s.libelle].filter(Boolean).join(" · ")}</option>)}
            </SelectRecherche>
          </FormField>

          <div className="kit-form-section">
            <strong>2 · {t("linge.assign.step_linens", "Linges à affecter")}</strong>
            <small>{t("linge.assign.step_linens_hint", "Scannez les linges un par un ou reprenez le résultat des filtres")}</small>
          </div>
          <Tabs
            value={source}
            onChange={setSource}
            items={[
              { value: "scan", icon: <ScanLine size={15} />, label: t("linge.assign.by_scan", "Par scan") },
              { value: "filtres", icon: <Filter size={15} />, label: t("linge.assign.by_filters", "Selon les filtres") },
            ]}
          />

          {source === "scan" ? (
            <div className={`kit-scan ${recherche ? "is-ready" : ""}`}>
              <ScanLine size={22} className="kit-scan__icon" />
              <input
                ref={inputRef}
                value={saisie}
                placeholder={t("linge.assign.scan_placeholder", "Scanner ou saisir un code linge")}
                onChange={(e) => setSaisie(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); ajouterCodes(saisie); } }}
                onPaste={(e) => {
                  const texte = e.clipboardData.getData("text");
                  if (decouper(texte).length > 1) { e.preventDefault(); ajouterCodes(texte); }
                }}
                disabled={enCours}
                autoComplete="off"
              />
              <span className="kit-scan__status">{recherche ? t("common.loading") : t("linge.assign.enter_hint", "Entrée pour ajouter")}</span>
            </div>
          ) : (
            <div className="lsa-filters">
              <div className="kit-chips">
                {filterChips.length
                  ? filterChips.map((c) => <span key={c} className="kit-chip kit-chip--teal">{c}</span>)
                  : <span className="kit-chip">{t("linge.stats.no_filter", "Aucun filtre : tous les linges")}</span>}
              </div>
              <Button variant="secondary" icon={chargement ? <Loader2 size={16} className="animate-spin" /> : <Filter size={16} />} onClick={chargerDepuisFiltres} disabled={chargement || enCours}>
                {t("linge.assign.load_filters", "Charger les linges filtrés")}
              </Button>
            </div>
          )}

          <div className="kit-codes-head" style={{ marginTop: 6 }}>
            <strong>{t("linge.assign.preview", "Aperçu")}</strong>
            <span className="kit-chip kit-chip--teal"><strong>{linges.length}</strong></span>
            {cibleId && linges.length > aChanger.length && (
              <span className="kit-chip">{t("linge.assign.already_count", "{{count}} déjà dans ce service", { count: linges.length - aChanger.length })}</span>
            )}
            {linges.length > 0 && (
              <button type="button" className="kit-codes-clear" onClick={() => setLinges([])} disabled={enCours}>{t("historique_collecte.add_linens_clear", "Tout effacer")}</button>
            )}
          </div>

          {enCours && (
            <div className="lsa-progress">
              <div className="kit-gauge"><span style={{ width: `${pct}%`, background: "var(--teal-600)" }} /></div>
              <small>{progression} / {aChanger.length} · {pct}%</small>
            </div>
          )}

          {linges.length === 0 ? (
            <div className="kit-codes-empty">
              <Building2 size={26} />
              <span>{t("linge.assign.empty", "Aucun linge sélectionné pour le moment.")}</span>
            </div>
          ) : (
            <div className="lsa-table">
              <DataTable columns={colonnes} rows={linges} rowKey={(l) => l.id} />
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
