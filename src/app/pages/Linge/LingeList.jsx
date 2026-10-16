import React, { useContext, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { LingeContext } from "../../contextes/LingeContext";
import { ServiceContext } from "../../contextes/ServiceContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useModal } from "../../contextes/ModalContext";
import "./WorkflowList.css";
import "./LingeList.css";
import { printLabel } from "../../utils/labels";
import Swal from 'sweetalert2';
import { LingeImportModal } from "./LingeImportModal";
import { EMPTY_LINGE_FORM, EMPTY_FILTERS } from "./lingeConstants";
import { LingeHeader } from "./components/LingeHeader";
import { LingeToolbar } from "./components/LingeToolbar";
import { LingeFilters } from "./components/LingeFilters";
import { LingeTable } from "./components/LingeTable";
import { LingePagination } from "./components/LingePagination";
import { LingeFormModal } from "./components/LingeFormModal";
import { RfidAssociationModal } from "./components/RfidAssociationModal";
import { LingeDetailModal } from "./components/LingeDetailModal";
import { PrintConfirmModal } from "./components/PrintConfirmModal";
import { LingeIncompletsBanner } from "./components/LingeIncompletsBanner";
import { LingeStatsModal } from "./components/LingeStatsModal";
import { fetchAllLinges, computeLingeStats, exportLingesXlsx } from "./lingeStats";
import { fetchLingesIncomplets } from "../../services/analyseService";
import { getSetting } from "../../utils/appSettings";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";


export default function LingeList() {
  const { t } = useTranslation();

  // ─── CONTEXTES ──────────────────────────────────────────────────────────
  const {
    linges,
    addLinge,
    deleteLinge,
    formatEPC,
    isRfidMode,
    fetchLingesPaged,
    getLingeByCode,
    checkCodeExists,
    associerTagRfid,
    pagedData,
    setPagedData,
    setIsImportModalOpen,
    setImportType,
  } = useContext(LingeContext);

  const { services } = useContext(ServiceContext);
  const navigate = useNavigate();
  // Lignes par page : Paramètres › Affichage
  const pageSize = Number(getSetting("display.pageSize")) || 10;

  // ─── MODE « LINGES INCOMPLETS » (?incomplets ou ?incomplets=POIDS) ─────
  const [searchParams, setSearchParams] = useSearchParams();
  const modeIncomplets = searchParams.has("incomplets");
  const attributIncomplet = searchParams.get("incomplets") || "";
  const [resumeIncomplets, setResumeIncomplets] = useState(null);
  const { showAlert, showConfirm } = useModal();

  // ─── ÉTATS ──────────────────────────────────────────────────────────────
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const [showPopup, setShowPopup] = useState(false);
  const [selectedLingeForPrint, setSelectedLingeForPrint] = useState(null);
  const [lingeToPrint, setLingeToPrint] = useState(null);
  const [selectedLingeDetail, setSelectedLingeDetail] = useState(null);
  const [lingeToEdit, setLingeToEdit] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [showRfidPopup, setShowRfidPopup] = useState(false);
  const [rfidCode, setRfidCode] = useState("");
  const [selectedLingeForRfid, setSelectedLingeForRfid] = useState(null);
  // Mode de lecture réglé dans Paramètres › Lecture / Scan
  const displayMode = isRfidMode ? "RFID" : "BARCODE";
  const [personnel, setPersonnel] = useState([]);
  const [isPersonnelLoading, setIsPersonnelLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [creationMode, setCreationMode] = useState("auto");

  // ─── STATISTIQUES / EXPORT (toute la sélection filtrée) ───────────────
  const [statsOpen, setStatsOpen] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState("");
  const [selection, setSelection] = useState(null); // { key, linges }
  const [exporting, setExporting] = useState(false);

  // ─── ÉTAT DU FORMULAIRE ────────────────────────────────────────────────
  const [newLinge, setNewLinge] = useState(EMPTY_LINGE_FORM);

  // ─── CHARGEMENT PERSONNEL ──────────────────────────────────────────────
  const fetchPersonnel = async () => {
    setIsPersonnelLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/sqlserver/personnel`);
      if (response.ok) {
        const data = await response.json();
        const normalized = (Array.isArray(data) ? data : []).map((p) => ({
          id:         p.Id         ?? p.id,
          nom:        p.Nom        ?? p.nom        ?? "",
          prenom:     p.Prenom     ?? p.prenom     ?? "",
          nomPrenom:  p.NomPrenom  ?? p.nomPrenom  ?? "",
          matricule:  p.Matricule  ?? p.matricule  ?? "",
          codeBarre:  p.CodeBarre  ?? p.codeBarre  ?? "",
          fonction:   p.Fonction   ?? p.fonction   ?? null,
          serviceId:  p.ServiceID  ?? p.serviceId  ?? null,
        }));
        setPersonnel(normalized);
      }
    } catch (err) {
      console.error("Erreur chargement personnel:", err);
    } finally {
      setIsPersonnelLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonnel();
  }, []);

  // ─── CHARGEMENT PAGINÉ ─────────────────────────────────────────────────
  const loadIncomplets = async (page) => {
    const res = await fetchLingesIncomplets({ attribut: attributIncomplet || undefined, page, size: pageSize });
    // Compteurs par attribut : toujours ceux de l'analyse complète (sans filtre)
    const tous = !attributIncomplet ? res : await fetchLingesIncomplets({ page: 0, size: 1 }).catch(() => null);
    if (tous) setResumeIncomplets({ total: tous.total, parAttribut: tous.parAttribut });
    return {
      content: (res.linges || []).map((l) => ({ ...l, codebarre: l.codebarre ?? l.codeBarre })),
      totalPages: res.totalPages || 0,
      totalElements: res.total || 0,
      number: res.page || 0,
      size: res.size,
    };
  };

  const loadPage = async (page) => {
    if (!fetchLingesPaged) return;
    setSelection(null); // les données ont pu changer : statistiques à recalculer
    setIsLoading(true);
    try {
      const data = modeIncomplets
        ? await loadIncomplets(page).catch((err) => {
            showAlert(t('messages.error'), err.message, "error");
            return { content: [], totalPages: 0, totalElements: 0, number: 0 };
          })
        : await fetchLingesPaged(page, pageSize, filters);
      if (data) {
        setPagedData(data);
        setCurrentPage(data.number || 0);
      }
    } catch (error) {
      console.error("Erreur chargement page:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setSelectedId(null);
    loadPage(0);
  }, [filters, modeIncomplets, attributIncomplet]);

  // ─── PAGINATION ─────────────────────────────────────────────────────────
  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < pagedData.totalPages) {
      loadPage(newPage);
    }
  };

  // ─── IMPRESSION ÉTIQUETTE (réglages : Paramètres › Étiquettes) ───────
  const handlePrint = () => {
    if (!selectedLingeForPrint) return;
    printLabel("linge", selectedLingeForPrint, {
      t,
      services,
      porteurName: selectedLingeForPrint.porteurId ? getPorteurName(selectedLingeForPrint.porteurId) : "",
    });
    setSelectedLingeForPrint(null);
  };

  // ─── SAUVEGARDE ─────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (lingeToEdit) {
        const updatePayload = {
          categorie: newLinge.categorie,
          poids: parseFloat(newLinge.poids) || 0,
          serviceId: newLinge.serviceId ? parseInt(newLinge.serviceId) : null,
          etat: newLinge.etat,
          durevie: newLinge.dureVie ? parseInt(newLinge.dureVie) : null,
          porteurId: newLinge.porteurId ? parseInt(newLinge.porteurId) : null,
          rfidTag: newLinge.rfidTag?.trim() || null,
          observations: newLinge.observations?.trim() || null
        };

        const response = await fetch(`${API_URL}/api/linges/${lingeToEdit.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload)
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(error);
        }

        const updated = await response.json();

        const updatedLinges = (pagedData.content || []).map(l =>
          l.id === updated.id ? updated : l
        );
        setPagedData({ ...pagedData, content: updatedLinges });

        setLingeToEdit(null);
        setShowPopup(false);
        loadPage(currentPage);

        Swal.fire({
          title: "✅ " + t('messages.success'),
          text: t('linge.update_success'),
          icon: "success",
          timer: 1500,
          showConfirmButton: false
        });
        return;
      }

      if (creationMode === "manual") {
        const codeToCheck = newLinge.codebarre.trim();
        if (!codeToCheck) {
          showAlert(t('messages.warning'), t('linge.scan_required_manual'), "warning");
          setIsSaving(false);
          return;
        }
        if (checkCodeExists) {
          const exists = await checkCodeExists(codeToCheck);
          if (exists) {
            showAlert(t('messages.error'), t('linge.code_exists', { code: codeToCheck }), "error");
            setIsSaving(false);
            return;
          }
        }
      }

      const payload = {
        codeBarre: (creationMode === "auto" || !newLinge.codebarre.trim()) ? null : newLinge.codebarre.trim(),
        categorie: newLinge.categorie,
        poids: parseFloat(newLinge.poids) || 0,
        etat: newLinge.etat || "SALE",
        serviceId: newLinge.serviceId ? parseInt(newLinge.serviceId) : null,
        durevie: newLinge.dureVie ? parseInt(newLinge.dureVie) : null,
        porteurId: newLinge.porteurId ? parseInt(newLinge.porteurId) : null,
        observations: newLinge.observations?.trim() || null
      };

      if (newLinge.rfidTag?.trim()) {
        payload.rfidTag = newLinge.rfidTag.trim();
      }

      if (!payload.serviceId && services.length > 0) {
        payload.serviceId = services[0].id;
      }

      const created = await addLinge(payload);
      if (created) {
        setLingeToPrint(created);
        setShowPopup(false);
        setNewLinge(EMPTY_LINGE_FORM);
        loadPage(0);
        showAlert(t('messages.success'), t('linge.create_success'), "success");
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      showAlert(t('messages.error'), error.message || t('linge.error_operation'), "error");
    } finally {
      setIsSaving(false);
    }
  };

  // ─── ASSOCIATION RFID ──────────────────────────────────────────────────
  const openRfidPopup = (linge) => {
    setSelectedLingeForRfid(linge);
    setRfidCode("");
    setShowRfidPopup(true);
  };

  const closeRfidPopup = () => {
    setShowRfidPopup(false);
    setRfidCode("");
    setSelectedLingeForRfid(null);
  };

  const handleAssocierRfid = async () => {
    if (!selectedLingeForRfid) {
      showAlert(t('messages.error'), t('linge.no_linge_selected'), "error");
      return;
    }
    if (!rfidCode.trim()) {
      showAlert(t('messages.warning'), t('linge.rfid_required'), "warning");
      return;
    }

    try {
      const result = await associerTagRfid(selectedLingeForRfid.codebarre, rfidCode.trim());
      if (result) {
        showAlert(t('messages.success'), t('linge.rfid_success', { code: selectedLingeForRfid.codebarre }), "success");
        closeRfidPopup();
        loadPage(currentPage);
      }
    } catch (error) {
      showAlert(t('messages.error'), `❌ ${error.message || t('linge.rfid_error')}`, "error");
    }
  };

  // Bouton « Associer RFID » de la barre d'outils (sur la ligne sélectionnée)
  const handleToolbarRfid = () => {
    if (!selectedId) {
      showAlert(t('messages.info'), t('linge.select_article'), "info");
      return;
    }
    const linge = displayedLinges.find(l => l.id === selectedId) || linges.find(l => l.id === selectedId);
    if (!linge) {
      showAlert(t('messages.error'), t('linge.not_found'), "error");
      return;
    }
    if (linge.rfidTag && linge.rfidTag !== "") {
      showAlert(t('messages.warning'), t('linge.rfid_already'), "warning");
      return;
    }
    openRfidPopup(linge);
  };

  // ─── DÉTAILS ────────────────────────────────────────────────────────────
  const handleDetail = (id) => {
    let l = displayedLinges.find(item => item.id === id);
    if (!l && linges && linges.length > 0) {
      l = linges.find(item => item.id === id);
    }
    if (!l && pagedData.content) {
      l = pagedData.content.find(item => item.id === id);
    }
    if (l) {
      setSelectedLingeDetail(l);
    } else {
      showAlert(t('messages.error'), t('linge.not_found'), "error");
    }
  };

  // ─── ÉDITION ────────────────────────────────────────────────────────────
  const handleEdit = (linge) => {
    if (!linge && selectedId) {
      const l = displayedLinges.find(item => item.id === selectedId) ||
                pagedData.content.find(item => item.id === selectedId);
      if (l) {
        linge = l;
      }
    }
    if (!linge) {
      showAlert(t('messages.error'), t('linge.no_selection'), "error");
      return;
    }
    setNewLinge({
      categorie: linge.categorie || "",
      poids: linge.poids || 0,
      serviceId: linge.serviceId || "",
      codebarre: linge.codebarre || "",
      rfidTag: linge.rfidTag || "",
      dureVie: linge.dureVie || "",
      porteurId: linge.porteurId || "",
      etat: linge.etat || "SALE",
      observations: linge.observations || ""
    });
    setLingeToEdit(linge);
    setShowPopup(true);
  };

  // ─── SUPPRESSION ───────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (selectedId) {
      const confirmed = await showConfirm(t('messages.warning'), t('linge.delete_confirm_text'), "warning");
      if (confirmed) {
        await deleteLinge(selectedId);
        setSelectedId(null);
        loadPage(currentPage);
      }
    }
  };

  // ─── OUVERTURE IMPORT ──────────────────────────────────────────────────
  const handleOpenImport = () => {
    setImportType('LINGE');
    setIsImportModalOpen(true);
  };

  // ─── RÉINITIALISATION FILTRES (le rechargement suit le changement) ────
  const resetFilters = () => {
    setFilters(EMPTY_FILTERS);
  };

  // ─── SÉLECTION COMPLÈTE : chargée une fois par jeu de filtres ─────────
  const filtersKey = JSON.stringify(filters);
  const loadSelection = async () => {
    if (selection?.key === filtersKey) return selection.linges;
    const all = await fetchAllLinges(filters);
    setSelection({ key: filtersKey, linges: all });
    return all;
  };

  const openStats = async () => {
    setStatsOpen(true);
    setStatsError("");
    if (selection?.key === filtersKey) return;
    setStatsLoading(true);
    try {
      await loadSelection();
    } catch (err) {
      setStatsError(`${t('linge.stats.load_error', 'Impossible de charger les statistiques')} (${err.message})`);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const all = await loadSelection();
      if (!all.length) {
        showAlert(t('messages.info'), t('linge.export.empty', 'Aucun linge à exporter avec ces filtres.'), "info");
        return;
      }
      exportLingesXlsx(all, {
        t,
        getServiceName,
        getPorteurName: (id) => getPorteurName(id),
        filtersLabel: filterChips.length ? filterChips.join(" · ") : t('linge.stats.no_filter', 'Aucun filtre : tous les linges'),
      });
    } catch (err) {
      showAlert(t('messages.error'), `${t('linge.export.error', "L'export a échoué")} (${err.message})`, "error");
    } finally {
      setExporting(false);
    }
  };

  // ─── LINGES INCOMPLETS : fiche complète avant détail / modification ──
  const chargerLingeComplet = async (l) => {
    if (!modeIncomplets || !l || !getLingeByCode) return l;
    const complet = await getLingeByCode(l.codebarre);
    return complet ? { ...l, ...complet, codebarre: complet.codebarre ?? complet.codeBarre ?? l.codebarre } : l;
  };

  const ouvrirDetail = async (id) => {
    if (!modeIncomplets) return handleDetail(id);
    const l = displayedLinges.find((item) => item.id === id);
    if (l) setSelectedLingeDetail(await chargerLingeComplet(l));
  };

  const ouvrirEdition = async (linge) => {
    const l = linge || displayedLinges.find((item) => item.id === selectedId);
    handleEdit(modeIncomplets ? await chargerLingeComplet(l) : l);
  };

  const changerAttribut = (a) => setSearchParams(a ? { incomplets: a } : { incomplets: "" }, { replace: true });

  // ─── ROW CLICK ─────────────────────────────────────────────────────────
  const handleRowClick = (id) => {
    setSelectedId((prev) => (prev === id ? null : id));
  };

  // ─── DONNÉES AFFICHÉES ─────────────────────────────────────────────────
  const displayedLinges = pagedData.content || [];
  const selectedLinge = displayedLinges.find((l) => l.id === selectedId);

  // ─── GET SERVICE NAME ──────────────────────────────────────────────────
  const getServiceName = (serviceId) => {
    if (!serviceId) return t('linge.unassigned');
    const service = services.find(s => s.id === serviceId);
    return service ? service.code : t('linge.unassigned');
  };

  // ─── GET PORTEUR NAME ──────────────────────────────────────────────────
  const getPorteurName = (porteurId) => {
    if (!porteurId) return t('linge.unassigned');
    const porteur = personnel.find(p => p.id === porteurId);
    if (porteur) {
      return `${porteur.prenom} ${porteur.nom}`;
    }
    return t('linge.unassigned');
  };

  // Libellés des filtres actifs (fenêtre de statistiques et export)
  const filterChips = [
    filters.etat && `${t('linge.status')} : ${t(`linge_etat.${filters.etat}`, filters.etat)}`,
    filters.categorie && `${t('linge.category')} : ${t(`categories.${filters.categorie}`, filters.categorie)}`,
    filters.serviceId && `${t('linge.service')} : ${getServiceName(Number(filters.serviceId))}`,
    filters.search && `${t('common.search')} : « ${filters.search} »`,
  ].filter(Boolean);
  const stats = selection?.key === filtersKey ? computeLingeStats(selection.linges) : null;

  return (
    <div className="space-y-8">
      <LingeHeader displayMode={displayMode} />

      <LingeToolbar
        hasSelection={!!selectedId}
        isLoading={isLoading}
        onNew={() => {
          setShowPopup(true);
          setLingeToEdit(null);
        }}
        onImport={handleOpenImport}
        onAssociateRfid={handleToolbarRfid}
        onDetail={() => selectedId && ouvrirDetail(selectedId)}
        onEdit={() => selectedId && ouvrirEdition(selectedLinge)}
        onDelete={handleDelete}
        onPrintLabel={() => {
          if (selectedId) {
            setSelectedLingeForPrint(selectedLinge);
            setTimeout(() => handlePrint(), 300);
          }
        }}
        onHistory={() => selectedId && navigate(`/tracking?code=${selectedLinge?.codebarre}`)}
        onRefresh={() => loadPage(currentPage)}
      />

      {modeIncomplets ? (
        <LingeIncompletsBanner
          resume={resumeIncomplets}
          attribut={attributIncomplet}
          onAttributChange={changerAttribut}
          onQuit={() => navigate("/linges")}
        />
      ) : (
        <LingeFilters
          filters={filters}
          onChange={setFilters}
          services={services}
          onReset={resetFilters}
          onStats={openStats}
          onExport={handleExport}
          exporting={exporting}
        />
      )}

      <LingeTable
        linges={displayedLinges}
        isLoading={isLoading}
        displayMode={displayMode}
        selectedId={selectedId}
        formatEPC={formatEPC}
        getServiceName={getServiceName}
        onRowClick={handleRowClick}
        onDetail={ouvrirDetail}
        showMissing={modeIncomplets}
        onAssociateRfid={openRfidPopup}
      />

      <LingePagination
        currentPage={currentPage}
        pageSize={pageSize}
        itemCount={displayedLinges.length}
        totalElements={pagedData.totalElements}
        totalPages={pagedData.totalPages}
        isLoading={isLoading}
        onPageChange={handlePageChange}
      />

      <LingeFormModal
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        onSubmit={handleSave}
        lingeToEdit={lingeToEdit}
        newLinge={newLinge}
        setNewLinge={setNewLinge}
        creationMode={creationMode}
        setCreationMode={setCreationMode}
        services={services}
        personnel={personnel}
        isSaving={isSaving}
      />

      <RfidAssociationModal
        isOpen={showRfidPopup}
        onClose={closeRfidPopup}
        linge={selectedLingeForRfid}
        rfidCode={rfidCode}
        setRfidCode={setRfidCode}
        onSubmit={handleAssocierRfid}
      />

      <LingeDetailModal
        linge={selectedLingeDetail}
        onClose={() => setSelectedLingeDetail(null)}
        onEdit={(linge) => {
          setSelectedLingeDetail(null);
          handleEdit(linge);
        }}
        getServiceName={getServiceName}
        getPorteurName={getPorteurName}
      />

      <PrintConfirmModal
        isOpen={!!lingeToPrint}
        onClose={() => setLingeToPrint(null)}
        onConfirm={() => {
          setSelectedLingeForPrint(lingeToPrint);
          setTimeout(() => handlePrint(), 500);
          setLingeToPrint(null);
        }}
      />

      <LingeStatsModal
        isOpen={statsOpen}
        onClose={() => setStatsOpen(false)}
        stats={stats}
        loading={statsLoading}
        error={statsError}
        filterChips={filterChips}
        getServiceName={getServiceName}
        onExport={handleExport}
        exporting={exporting}
      />

      {/* ─── MODAL D'IMPORT ─────────────────────────────────────────────── */}
      <LingeImportModal />
    </div>
  );
}
