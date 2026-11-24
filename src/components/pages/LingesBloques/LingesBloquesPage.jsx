import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { AlertOctagon, CheckCircle2, HelpCircle, Loader2, Radar, RefreshCw, SlidersHorizontal, Table2, UserX } from "lucide-react";
import { ServiceContext } from "../../../contextes/ServiceContext";
import { useAuth } from "../../../constants/AuthContext";
import { NAV_ITEMS } from "../../../constants/navigation";
import { isAdministrateur } from "../../../utils/privileges";
import { formatDateTime } from "../../../utils/appSettings";
import { analyserLingesBloques, fetchLingesBloques } from "../../../services/analyseService";
import {
  Page, ActionBar, ActionButton, FilterPanel, FilterRow, FilterSelect,
  DataTable, Pagination, Badge, Code, Tabs, StatChips, DetailAlert, Button,
  ListSection, RowActions, RowButton, useRowSelection,
} from "../../kit";
import { declarerLingeManquant, declarerLingesManquants } from "../../../services/lingeService";
import SeuilsBlocage from "./SeuilsBlocage";
import DeclarerManquantDialog from "./DeclarerManquantDialog";
import { formatDuree, libelleEtat, etatsTries } from "./lingesBloquesUtils";
import "./LingesBloques.css";

const TAILLE = 50;

export default function LingesBloquesPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { services = [] } = useContext(ServiceContext) || {};
  const { admin, privileges = [] } = useAuth();
  const estAdmin = admin || isAdministrateur(privileges, NAV_ITEMS);

  const etat = searchParams.get("etat") || "";
  const serviceId = searchParams.get("service") || "";
  const onglet = estAdmin && searchParams.get("onglet") === "seuils" ? "seuils" : "liste";

  const [page, setPage] = useState(0);
  const [resultat, setResultat] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [analyse, setAnalyse] = useState(false);
  const [recharge, setRecharge] = useState(0);
  const [parEtatGlobal, setParEtatGlobal] = useState({});
  const [aDeclarer, setADeclarer] = useState(null);
  const [declaration, setDeclaration] = useState({ busy: false, erreur: null });

  const majParams = (modifs) => {
    const p = new URLSearchParams(searchParams);
    Object.entries(modifs).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    setSearchParams(p, { replace: true });
  };

  useEffect(() => {
    let annule = false;
    const id = setTimeout(() => {
      setChargement(true);
      fetchLingesBloques({ etat: etat || undefined, serviceId: serviceId || undefined, page, size: TAILLE })
        .then((data) => {
          if (annule) return;
          setResultat(data);
          setErreur(null);
          if (!etat && !serviceId) setParEtatGlobal(data?.parEtat || {});
        })
        .catch((e) => { if (!annule) setErreur(e.message); })
        .finally(() => { if (!annule) setChargement(false); });
    }, 0);
    return () => { annule = true; clearTimeout(id); };
  }, [etat, serviceId, page, recharge]);

  useEffect(() => {
    if (!etat && !serviceId) return undefined;
    let annule = false;
    fetchLingesBloques({ page: 0, size: 1 })
      .then((data) => { if (!annule) setParEtatGlobal(data?.parEtat || {}); })
      .catch(() => {});
    return () => { annule = true; };
  }, [etat, serviceId, recharge]);

  const lancerAnalyse = useCallback(async () => {
    setAnalyse(true);
    try {
      const res = await analyserLingesBloques();
      toast.success(t("linges_bloques.analysis_done", "Analyse terminée : {{total}} linge(s) bloqué(s), {{manquants}} manquant(s) possible(s)", {
        total: res?.total ?? 0,
        manquants: res?.manquantsPossibles ?? 0,
      }));
      setPage(0);
      setRecharge((n) => n + 1);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setAnalyse(false);
    }
  }, [t]);

  const nomService = useCallback((id) => {
    if (id == null) return "—";
    const s = services.find((x) => String(x.id) === String(id));
    return s ? (s.nom || s.code) : `#${id}`;
  }, [services]);

  const optionsEtat = useMemo(() => {
    const cles = new Set(Object.keys(parEtatGlobal || {}));
    if (etat) cles.add(etat);
    return [...cles].map((e) => ({ value: e, label: `${libelleEtat(t, e)} (${parEtatGlobal?.[e] ?? 0})` }));
  }, [parEtatGlobal, etat, t]);

  const optionsService = useMemo(
    () => services.map((s) => ({ value: String(s.id), label: s.nom || s.code })).sort((a, b) => a.label.localeCompare(b.label)),
    [services],
  );

  const linges = useMemo(() => resultat?.linges || [], [resultat]);
  const sel = useRowSelection(linges, (l) => l.id ?? l.codeBarre);

  const ouvrirDeclaration = (liste) => {
    const cibles = liste.filter((l) => l.id != null);
    if (!cibles.length) return;
    setDeclaration({ busy: false, erreur: null });
    setADeclarer(cibles);
  };

  const confirmerDeclaration = async (remarques) => {
    const cibles = aDeclarer || [];
    setDeclaration({ busy: true, erreur: null });
    const options = { remarques: remarques || undefined };
    try {
      if (cibles.length === 1) await declarerLingeManquant(cibles[0], options);
      else await declarerLingesManquants(cibles, options);
      toast.success(cibles.length === 1
        ? t("linges_bloques.missing.done_one", "Linge {{code}} déclaré manquant", { code: cibles[0].codeBarre })
        : t("linges_bloques.missing.done_many", "{{count}} linges déclarés manquants", { count: cibles.length }));
      setADeclarer(null);
      setDeclaration({ busy: false, erreur: null });
      sel.clear();
      setRecharge((n) => n + 1);
    } catch (e) {
      setDeclaration({ busy: false, erreur: e.message });
    }
  };
  const total = Number(resultat?.total) || 0;
  const totalPages = Math.max(1, Number(resultat?.totalPages) || 1);
  const filtre = Boolean(etat || serviceId);
  const totalGlobal = Object.values(parEtatGlobal || {}).reduce((s, n) => s + (Number(n) || 0), 0);

  const COLONNES = {
    codeBarre: { label: t("linges_bloques.cols.barcode", "Code-barres"), render: (l) => <Code>{l.codeBarre}</Code> },
    designation: { label: t("linges_bloques.cols.designation", "Désignation"), render: (l) => l.designation || "—" },
    categorie: { label: t("linges_bloques.cols.category", "Catégorie"), render: (l) => (l.categorie ? t(`categories.${l.categorie}`, l.categorie) : "—") },
    etat: { label: t("linges_bloques.cols.state", "État"), render: (l) => <span className="lb-etat">{libelleEtat(t, l.etat)}</span> },
    service: { label: t("linges_bloques.cols.service", "Service"), render: (l) => nomService(l.serviceId) },
    depuis: { label: t("linges_bloques.cols.since", "Depuis"), render: (l) => formatDateTime(l.depuis) },
    ecoule: { label: t("linges_bloques.cols.elapsed", "Durée écoulée"), align: "right", render: (l) => formatDuree(l.heuresEcoulees) },
    seuil: { label: t("linges_bloques.cols.threshold", "Seuil"), align: "right", render: (l) => <span className="kit-muted">{formatDuree(l.seuilHeures)}</span> },
    retard: { label: t("linges_bloques.cols.delay", "Retard"), align: "right", render: (l) => <strong className="lb-retard">+{formatDuree(l.retardHeures)}</strong> },
    alerte: {
      label: t("linges_bloques.cols.alert", "Alerte"), align: "center",
      render: (l) => (l.typeAlerte === "MANQUANT_POSSIBLE" || l.manquantPossible
        ? <Badge variant="warning"><HelpCircle size={12} /> {t("linges_bloques.missing_possible", "Manquant possible")}</Badge>
        : <Badge variant="danger"><AlertOctagon size={12} /> {t("linges_bloques.blocked", "Bloqué")}</Badge>),
    },
    ...(estAdmin ? {
      actions: {
        label: t("common.actions", "Actions"), align: "center",
        render: (l) => (
          <RowActions>
            <RowButton
              icon={UserX}
              tone="danger"
              title={t("linges_bloques.missing.confirm_one", "Déclarer manquant")}
              disabled={l.id == null}
              onClick={() => ouvrirDeclaration([l])}
            />
          </RowActions>
        ),
      },
    } : {}),
  };

  return (
    <Page>
      <ActionBar>
        <ActionButton
          icon={analyse ? <Loader2 size={18} className="animate-spin" /> : <Radar size={18} />}
          label={t("linges_bloques.analyze_now", "Analyser maintenant")}
          variant="ajouter"
          disabled={analyse}
          onClick={lancerAnalyse}
        />
        <ActionButton
          icon={<RefreshCw size={18} className={chargement ? "animate-spin" : ""} />}
          label={t("common.refresh", "Actualiser")}
          variant="details"
          onClick={() => setRecharge((n) => n + 1)}
        />
      </ActionBar>

      {estAdmin && (
        <div className="kit-toolbar">
          <Tabs
            value={onglet}
            onChange={(v) => majParams({ onglet: v === "seuils" ? "seuils" : "" })}
            items={[
              { value: "liste", icon: <Table2 size={15} />, label: t("linges_bloques.tab_list", "Linges bloqués"), count: totalGlobal },
              { value: "seuils", icon: <SlidersHorizontal size={15} />, label: t("linges_bloques.tab_thresholds", "Seuils") },
            ]}
          />
        </div>
      )}

      {onglet === "seuils" ? (
        <SeuilsBlocage />
      ) : (
        <>
          {resultat && (
            <StatChips items={[
              { label: t("linges_bloques.blocked_plural", "bloqué(s)"), value: total, tone: total > 0 ? "danger" : "success", icon: <AlertOctagon size={14} /> },
              { label: t("linges_bloques.missing_possible_plural", "manquant(s) possible(s)"), value: Number(resultat.manquantsPossibles) || 0, tone: "warning", icon: <HelpCircle size={14} /> },
              ...etatsTries(parEtatGlobal).slice(0, 4).map(([e, n]) => ({ label: libelleEtat(t, e), value: n, tone: e === etat ? "teal" : "default" })),
            ]} />
          )}

          <FilterPanel>
            <FilterRow>
              <FilterSelect
                label={t("linges_bloques.cols.state", "État")}
                value={etat || "all"}
                onChange={(v) => { setPage(0); majParams({ etat: v === "all" ? "" : v }); }}
                allLabel={t("common.all", "Tous")}
                options={optionsEtat}
              />
              <FilterSelect
                label={t("linges_bloques.cols.service", "Service")}
                value={serviceId || "all"}
                onChange={(v) => { setPage(0); majParams({ service: v === "all" ? "" : v }); }}
                allLabel={t("common.all", "Tous")}
                options={optionsService}
                wide
              />
              {filtre && (
                <Button variant="secondary" onClick={() => { setPage(0); majParams({ etat: "", service: "" }); }}>
                  {t("common.reset", "Réinitialiser")}
                </Button>
              )}
            </FilterRow>
          </FilterPanel>

          {erreur && !chargement && (
            <DetailAlert title={erreur}>
              <Button variant="secondary" icon={<RefreshCw size={14} />} onClick={() => setRecharge((n) => n + 1)}>{t("suiviStock.retry", "Réessayer")}</Button>
            </DetailAlert>
          )}

          {!erreur && !chargement && linges.length === 0 ? (
            <div className="lb-vide" role="status">
              <span className="lb-vide__icon"><CheckCircle2 size={34} /></span>
              <strong>{t("linges_bloques.empty", "Aucun linge bloqué")}</strong>
              <span>
                {filtre
                  ? t("linges_bloques.empty_filtered", "Aucun linge bloqué ne correspond à ces filtres.")
                  : t("linges_bloques.empty_hint", "Tous les linges circulent dans les délais prévus.")}
              </span>
            </div>
          ) : !erreur && (
            <ListSection
              selection={estAdmin ? sel : undefined}
              unit={t("linges_bloques.unit_one", "linge")}
              units={t("linges_bloques.unit_many", "linges")}
              bulkActions={estAdmin ? [{
                label: t("linges_bloques.missing.bulk", "Déclarer manquant(s)"),
                variant: "danger",
                onClick: (items) => ouvrirDeclaration(items),
              }] : undefined}
            >
              <DataTable
                columns={COLONNES}
                rows={linges}
                rowKey={(l) => l.id ?? l.codeBarre}
                selection={estAdmin ? sel : undefined}
                rowClassName={(l) => (l.typeAlerte === "MANQUANT_POSSIBLE" || l.manquantPossible ? "lb-row--manquant" : "lb-row--bloque")}
                loading={chargement && !linges.length}
                loadingText={t("common.loading", "Chargement…")}
                emptyText={t("linges_bloques.empty", "Aucun linge bloqué")}
              />
              <Pagination
                total={total}
                page={page + 1}
                totalPages={totalPages}
                pageSize={TAILLE}
                onPage={(p) => setPage(p - 1)}
                unit={t("linges_bloques.unit", "linge(s)")}
              />
            </ListSection>
          )}
        </>
      )}

      {aDeclarer && (
        <DeclarerManquantDialog
          linges={aDeclarer}
          busy={declaration.busy}
          erreur={declaration.erreur}
          onConfirm={confirmerDeclaration}
          onClose={() => { if (!declaration.busy) setADeclarer(null); }}
        />
      )}
    </Page>
  );
}
