import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, Loader2 } from "lucide-react";
import { Modal, Button, DataTable, Pagination } from "../kit";

const TAILLE_PAGE = 50;

export default function ImportCubixModal({ title, fetchPage, importer, typeOptions, extra, buildBody, onClose, onImporte }) {
  const { t } = useTranslation();
  const [recherche, setRecherche] = useState("");
  const [terme, setTerme] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [choix, setChoix] = useState({});
  const [importing, setImporting] = useState(false);
  const [resultat, setResultat] = useState(null);
  const caseTout = useRef(null);

  useEffect(() => {
    let actif = true;
    setLoading(true);
    setErreur(null);
    fetchPage({ q: terme, page, pageSize: TAILLE_PAGE })
      .then((res) => actif && setData({ items: res.items || [], total: res.total || 0 }))
      .catch((err) => actif && setErreur(err.message))
      .finally(() => actif && setLoading(false));
    return () => { actif = false; };
  }, [terme, page]);

  const totalPages = Math.max(1, Math.ceil(data.total / TAILLE_PAGE));
  const nbChoisies = Object.keys(choix).length;
  const sansType = !!typeOptions && Object.values(choix).some((ty) => !ty);
  const nbPage = data.items.filter((m) => m.id in choix).length;
  const toutePage = data.items.length > 0 && nbPage === data.items.length;

  useEffect(() => {
    if (caseTout.current) caseTout.current.indeterminate = nbPage > 0 && !toutePage;
  }, [nbPage, toutePage]);

  const rechercher = (e) => {
    e.preventDefault();
    setPage(1);
    setTerme(recherche.trim());
  };

  const cocher = (m) => setChoix((c) => {
    const suivant = { ...c };
    if (m.id in suivant) delete suivant[m.id]; else suivant[m.id] = "";
    return suivant;
  });

  const cocherPage = () => setChoix((c) => {
    const suivant = { ...c };
    if (toutePage) data.items.forEach((m) => delete suivant[m.id]);
    else data.items.forEach((m) => { if (!(m.id in suivant)) suivant[m.id] = ""; });
    return suivant;
  });

  const typer = (m, type) => setChoix((c) => ({ ...c, [m.id]: type }));

  const lancer = async () => {
    setImporting(true);
    setErreur(null);
    try {
      const corps = buildBody
        ? buildBody(Object.keys(choix).map(Number))
        : Object.entries(choix).map(([id, type]) => (typeOptions ? { id: Number(id), type } : Number(id)));
      const res = await importer(corps);
      setResultat(res);
      setChoix({});
      onImporte?.();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setImporting(false);
    }
  };

  const raison = (r) => t(`integration.import_reason.${r}`, {
    deja_importe: "Déjà importé",
    deja_classe: "Déjà classé autrement",
    introuvable: "Introuvable",
  }[r] || r);

  const columns = {
    choisir: {
      thStyle: { width: 36 },
      header: () => (
        <th style={{ width: 36 }}>
          <input ref={caseTout} type="checkbox" checked={toutePage} onChange={cocherPage} disabled={!data.items.length || importing} />
        </th>
      ),
      render: (m) => <input type="checkbox" checked={m.id in choix} onChange={() => cocher(m)} disabled={importing} aria-label={m.designation} />,
    },
    designation: { label: t("machines.designation", "Désignation"), render: (m) => <strong>{m.designation || "—"}</strong> },
    codeBarre: { label: t("integration.barcode", "Code-barres"), render: (m) => m.codeBarre || "—" },
    marque: { label: t("machines.brand", "Marque"), render: (m) => m.marque || "—" },
    modele: { label: t("machines.model", "Modèle"), render: (m) => m.modele || "—" },
  };

  if (typeOptions) {
    columns.type = {
      label: t("machines.type", "Type"),
      render: (m) => (m.id in choix ? (
        <select value={choix[m.id]} onChange={(e) => typer(m, e.target.value)} disabled={importing} required>
          <option value="">{t("integration.choose_type", "Choisir…")}</option>
          {typeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : "—"),
    };
  }

  return (
    <Modal
      size="lg"
      className="kit-std-form kit-import-modal"
      title={title}
      onClose={importing ? undefined : onClose}
      closeOnOverlay={false}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose} disabled={importing}>{t("common.close", "Fermer")}</Button>
          <Button onClick={lancer} disabled={importing || nbChoisies === 0 || sansType}>
            {importing && <Loader2 size={15} className="animate-spin" />}
            {importing ? t("integration.importing", "Import en cours…") : `${t("integration.import", "Importer")} (${nbChoisies})`}
          </Button>
        </>
      )}
    >
      <form onSubmit={rechercher} className="kit-import-search">
        <div className="kit-import-search__field">
          <Search size={16} className="kit-import-search__icon" />
          <input
            type="search"
            className="kit-import-search__input"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder={t("common.search", "Rechercher")}
            disabled={importing}
          />
        </div>
        <button type="submit" className="kit-import-search__btn" disabled={importing}>
          <Search size={15} />
          {t("common.search", "Rechercher")}
        </button>
      </form>

      {resultat && (
        <div style={{ marginBottom: 12 }}>
          {resultat.message && <p style={{ margin: 0, fontWeight: 600, color: "#059669" }}>{resultat.message}</p>}
          {resultat.ignores?.length > 0 && (
            <ul style={{ margin: "6px 0 0", paddingLeft: 18, color: "#b45309", fontSize: 13 }}>
              {resultat.ignores.map((i) => <li key={i.id}>#{i.id} : {raison(i.raison)}</li>)}
            </ul>
          )}
        </div>
      )}
      {erreur && <p style={{ margin: "0 0 12px", fontWeight: 600, color: "#dc2626" }}>{erreur}</p>}

      <DataTable
        columns={columns}
        rows={data.items}
        loading={loading}
        loadingText={t("common.loading", "Chargement…")}
        emptyText={t("common.no_data", "Aucune donnée")}
      />
      <Pagination total={data.total} page={page} totalPages={totalPages} pageSize={TAILLE_PAGE} onPage={setPage} unit="" />
      {extra}
    </Modal>
  );
}
