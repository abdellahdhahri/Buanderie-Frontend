import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { BarChart3, Boxes, Check, CheckCircle2, Loader2, LogOut, RefreshCw, RotateCcw, ScanLine, Wind } from "lucide-react";
import { SechageProvider, useSechage } from "../../../contextes/SechageContext";
import { getAgent, isAgentConnected } from "../../../services/agentService";
import ScanInput from "../../utils/shared/ScanInput";
import { LotBasketCard } from "../../utils/shared/LotBasket";
import { DataTable, Code, VueSwitch, useVue, RowActions, RowButton, Page, QuickStats } from "../../kit";
import { EmplacementMachine, Panneau } from "../Lavage/PosteLavage";
import { LotInfoDialogSechage } from "../../utils/LotInfoDialog";
import RecapSechage from "../../utils/RecapSechage";
import { libelleSourceBac } from "../../../services/bacTriService";
import "../Linge/WorkflowList.css";
import "../Collecte/shared/CollecteRh.css";
import "../Lavage/Lavage.css";
import "../Lavage/Atelier.css";
import "../Lavage/PosteLavage.css";
import "../Reception/Reception.css";
import "../Lavage/LavageV2.css";

function SechageInner() {
  const { t } = useTranslation();

  const {
    agent,
    setAgentDirect,
    etape, machine, lotsDisponibles, lotsSelectionnes,
    loadingLots, poidsTotal,
    scannerMachine, chargerLots, scannerLot,
    retirerLot, nouveauCycle,
  } = useSechage();

  const [scanVal, setScanVal] = useState("");
  const [searchLot, setSearchLot] = useState("");
  const [vueLots, setVueLots] = useVue("sechage.lots");

  // ═══════════════════════════════════════════════════════════════════════
  // ✅ RÉCUPÉRATION DE L'AGENT DEPUIS localStorage → pousse dans le contexte
  // ═══════════════════════════════════════════════════════════════════════
  useEffect(() => {
    const syncAgent = () => {
      const agentData = getAgent();
      if (agentData && isAgentConnected()) {
        setAgentDirect({
          ...agentData,
          matricule: agentData.matricule || agentData.codeBarre || agentData.login,
          codeBarre: agentData.codeBarre || agentData.matricule || agentData.login,
          nomPrenom: agentData.nomPrenom || agentData.nom || agentData.login || "Inconnu",
        });
      }
    };

    syncAgent();

    const handleFocus = () => syncAgent();
    const handleStorage = (e) => {
      if (e.key === "agent" || e.key === "auth") syncAgent();
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("storage", handleStorage);
    };
  }, [setAgentDirect]);

  // Charger les lots quand on entre dans l'étape LOTS
  useEffect(() => {
    if (agent && etape === "LOTS") chargerLots();
  }, [etape, agent, chargerLots]);

  const handleScan = async (code) => {
    setScanVal("");
    if (!code?.trim()) return;
    if (!agent) return;

    if (etape === "MACHINE") { await scannerMachine(code); return; }
    if (etape === "LOTS")    { await scannerLot(code, poidsTotal); return; }
  };

  const lotsFiltres = useMemo(() => {
    const ids = new Set(lotsSelectionnes.map(ls => ls.lot.id));
    return lotsDisponibles.filter(l =>
      !ids.has(l.id) &&
      (!searchLot ||
        l.codeLot.toLowerCase().includes(searchLot.toLowerCase()) ||
        l.categorie?.toLowerCase().includes(searchLot.toLowerCase()))
    );
  }, [lotsDisponibles, lotsSelectionnes, searchLot]);

  const getPlaceholder = () => {
    if (!agent) return t('sechage.agent_not_connected');
    if (etape === "MACHINE") return t('sechage.scan_dryer_code');
    if (etape === "LOTS") return t('sechage.scan_lot_wash');
    return t('sechage.scan');
  };

  const detailMachine = machine
    ? [t("sechage.dryer", "Séchoir"), machine.capaciteKg && `${machine.capaciteKg} kg`, machine.marque].filter(Boolean).join(" · ")
    : null;

  const [showStats, setShowStats] = useState(false);
  const changerSechoir = () => { setScanVal(""); nouveauCycle(); };
  const peutChanger = etape === "LOTS" || etape === "TERMINE";

  const nomAgent = agent ? String(agent.nomPrenom || agent.nom || agent.login || agent.matricule || "").trim() : "";
  const initialesAgent = nomAgent.split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]).join("").toUpperCase() || "?";
  const etapeFaite = [
    Boolean(agent),
    Boolean(machine) && etape !== "MACHINE",
    etape === "EN_COURS" || etape === "TERMINE",
    etape === "TERMINE",
  ];
  const etapeActive = etapeFaite.findIndex((f) => !f);
  const etapes = [
    t("sechage.step_identify", "Identification de l'agent"),
    t("sechage.step_dryer", "Séchoir"),
    t("sechage.step_load", "Chargement"),
    t("sechage.step_dry", "Séchage"),
  ];

  const stats = useMemo(() => {
    const poids = lotsDisponibles.reduce((s, l) => s + Number(l.poidsActuel || 0), 0);
    const pieces = lotsDisponibles.reduce((s, l) => s + Number(l.quantiteDeclaree ?? l.nbPieces ?? 0), 0);
    const parCategorie = lotsDisponibles.reduce((acc, l) => {
      const k = t(`categories.${l.categorie}`, l.categorie || "—");
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
    const parOrigine = lotsDisponibles.reduce((acc, l) => {
      const k = libelleSourceBac(t, l) || "—";
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
    return { poids, pieces, parCategorie, parOrigine };
  }, [lotsDisponibles, t]);

  return (
    <Page className="cr-page lv-page at-page lw-page rc lw-v2">
      <LotInfoDialogSechage />

      <div className="rc-toolbar">
        <div className="rc-head__right">
          {agent && (
            <div className="rc-agent">
              <span className="rc-agent__avatar">{initialesAgent}</span>
              <span className="rc-agent__text">
                <span className="rc-agent__name">{nomAgent || "—"}</span>
                <span className="rc-agent__id">{agent.matricule || agent.codeBarre}</span>
              </span>
            </div>
          )}
          <button type="button" className="rc-btn" disabled={!agent || etape !== "LOTS"} onClick={chargerLots}>
            <RefreshCw size={15} className={loadingLots ? "animate-spin" : ""} /> {t("common.refresh", "Actualiser")}
          </button>
          {etape === "TERMINE" ? (
            <button type="button" className="rc-btn rc-btn--primary" onClick={nouveauCycle}>
              <RotateCcw size={14} /> {t("sechage.new_cycle")}
            </button>
          ) : (
            <button type="button" className="rc-btn" disabled={!peutChanger} onClick={changerSechoir}>
              <LogOut size={14} /> {t("sechage.change_dryer", "Changer de séchoir")}
            </button>
          )}
          <button type="button" className="rc-btn" onClick={() => setShowStats(true)}>
            <BarChart3 size={15} /> {t("common.statistics", "Statistiques")}
          </button>
        </div>
      </div>

      <ol className="rc-steps rc-steps--4" aria-label={t("sechage.steps", "Étapes du séchage")}>
        {etapes.map((label, i) => (
          <li key={label} className={`rc-step ${etapeFaite[i] ? "is-done" : ""} ${etapeActive === i ? "is-active" : ""}`}>
            <span className="rc-step__num">{etapeFaite[i] ? <Check size={14} strokeWidth={3} /> : i + 1}</span>
            <span className="rc-step__label">{label}</span>
          </li>
        ))}
      </ol>

      <div className="lw-stack">
        <section className={`rc-card rc-scan ${!agent ? "is-infecte" : ""}`}>
          <header className="rc-scan__bar">
            <span className="rc-scan__title"><ScanLine size={17} /> {t("sechage.title")}</span>
            {machine && etape !== "MACHINE" && <span className="rc-mode"><i /> {t("sechage.dryer", "Séchoir")}</span>}
          </header>
          <div className="rc-scan__body lv2-scan">
            <div className={`rc-scan__field ${!agent ? "is-infecte" : ""}`}>
              <ScanInput
                placeholder=""
                value={scanVal}
                onChange={setScanVal}
                onSubmit={handleScan}
                borderColor={!agent ? "#e03131" : "#0d9488"}
                keepFocus={true}
                autoDebounce={true}
                disabled={!agent}
              />
            </div>
            <EmplacementMachine
              machine={etape !== "MACHINE" ? machine : null}
              icon={<Wind size={20} />}
              detail={detailMachine}
              tone="teal"
              videTitre={t("sechage.no_dryer", "Aucun séchoir")}
              charge={etape === "LOTS" || etape === "EN_COURS" ? { poids: poidsTotal } : null}
              onChanger={peutChanger ? changerSechoir : null}
            />
          </div>
        </section>

        {agent && etape !== "MACHINE" && (
          <div className="lw-work">
            <div className="lw-stack">
              {etape === "TERMINE" && (
                <section className="lw-done" role="status">
                  <span className="lw-done__icon"><CheckCircle2 size={26} /></span>
                  <div>
                    <h3>{t("sechage.drying_completed")}</h3>
                    <p>{lotsSelectionnes.length} {t("sechage.lots_dried")}</p>
                  </div>
                  <button type="button" className="lv-btn lv-btn--primary" onClick={nouveauCycle}>
                    <RotateCcw size={16} /> {t("sechage.new_cycle")}
                  </button>
                </section>
              )}

              {(etape === "LOTS" || etape === "EN_COURS") && (
                <Panneau
                  id="sc-lots-titre"
                  icon={<Boxes size={18} />}
                  titre={t("sechage.washed_lots")}
                  compte={lotsFiltres.length}
                  outils={(
                    <>
                      <input
                        type="search"
                        className="lw-search"
                        placeholder={t("common.search")}
                        aria-label={t("lavage.search_bac", "Rechercher un bac")}
                        value={searchLot}
                        onChange={(e) => setSearchLot(e.target.value)}
                        onFocus={(e) => e.stopPropagation()}
                      />
                      <VueSwitch value={vueLots} onChange={setVueLots} compact />
                    </>
                  )}
                >
                  {loadingLots ? (
                    <div className="lw-empty"><span className="lw-empty__icon"><Loader2 size={20} className="animate-spin" /></span><span>{t("common.loading")}</span></div>
                  ) : lotsFiltres.length === 0 ? (
                    <div className="lw-empty"><span className="lw-empty__icon"><Boxes size={20} /></span><span>{t("sechage.no_washed_lots")}</span></div>
                  ) : vueLots === "tableau" ? (
                    <DataTable
                      columns={{
                        codeLot: { label: t("tri.bac", "Bac"), render: (l) => <Code>{l.codeLot}</Code> },
                        categorie: { label: t("tri.category", "Catégorie"), render: (l) => t(`categories.${l.categorie}`, l.categorie || "—") },
                        typeCollecte: { label: t("tri.type", "Type"), render: (l) => l.typeCollecte || "—" },
                        source: { label: t("bacs.source", "Origine"), render: (l) => libelleSourceBac(t, l) },
                        quantite: { label: t("lavage.items"), align: "center", render: (l) => l.quantiteDeclaree ?? l.nbPieces ?? "—" },
                        poids: { label: t("tri.weight", "kg"), render: (l) => `${Number(l.poidsActuel || 0).toFixed(2)} kg` },
                        action: {
                          label: t("cycles.actions", "Actions"),
                          render: (l) => (
                            <RowActions>
                              <RowButton icon={Wind} title={t("lavage.add_lot", "Ajouter au chargement")} onClick={() => scannerLot(l.codeLot, poidsTotal)} />
                            </RowActions>
                          ),
                        },
                      }}
                      rows={lotsFiltres}
                      rowKey={(l) => l.id || l.codeLot}
                      activeId={null}
                    />
                  ) : (
                    <div className="lv-grid">
                      {lotsFiltres.map((lot) => (
                        <LotBasketCard
                          key={lot.id}
                          lot={lot}
                          t={t}
                          selected={!!lotsSelectionnes.find((ls) => ls.lot.id === lot.id)}
                          onSelect={(l) => {
                            const deja = !!lotsSelectionnes.find((ls) => ls.lot.id === l.id);
                            if (deja) retirerLot(l.codeLot);
                            else scannerLot(l.codeLot, poidsTotal);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </Panneau>
              )}
            </div>

            <RecapSechage />
          </div>
        )}
      </div>

      {showStats && (
        <QuickStats
          title={t("sechage.title")}
          subtitle={t("sechage.stats_subtitle", "Situation instantanée du poste de séchage")}
          onClose={() => setShowStats(false)}
          kpis={[
            { label: t("sechage.washed_lots", "Bacs lavés"), value: lotsDisponibles.length },
            { label: t("sechage.kpi_loaded", "Bacs chargés"), value: lotsSelectionnes.length, color: "#6366f1" },
            { label: t("sechage.kpi_weight", "Poids disponible"), value: `${stats.poids.toFixed(1)} kg`, color: "#f59e0b" },
            { label: t("sechage.kpi_pieces", "Pièces disponibles"), value: stats.pieces, color: "#10b981" },
          ]}
          repartitions={[{
            title: t("tri.category", "Catégorie"),
            items: Object.entries(stats.parCategorie).map(([label, value]) => ({ label, value })),
          }]}
          classements={[{
            title: t("bacs.source", "Origine"),
            items: Object.entries(stats.parOrigine).map(([label, value]) => ({ label, value })),
          }]}
        />
      )}
    </Page>
  );
}

export default function SechageList() {
  return <SechageProvider><SechageInner /></SechageProvider>;
}
