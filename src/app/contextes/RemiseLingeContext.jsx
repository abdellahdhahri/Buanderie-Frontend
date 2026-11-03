import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useModal } from "./ModalContext";
import {
  getAgentFromStorage,
  fetchAgentByMatricule,
  createRemise,
  fetchStatutCollecte,
  fetchHistoriqueRemises,
  scanLingeForRemise,
  fetchCollectesNonCloturees,
  fetchRemiseById,
  annulerLingeRemise
} from "../services/remiseLingeService";

// Items de la remise (quantiteCollectee = total à remettre, quantiteRemise = déjà remis)
const itemsDeRemise = (r) => {
  const list = r?.items || r?.remiseLingeItems || r?.articles;
  return Array.isArray(list) ? list.filter((i) => i?.categorie) : [];
};

// Items initiaux à partir de l'aperçu, si le backend ne renvoie pas les items avec la remise
const itemsDepuisApercu = (resteParCategorie) =>
  Object.entries(resteParCategorie || {}).map(([categorie, quantite]) => ({
    categorie,
    quantiteCollectee: quantite,
    quantiteRemise: 0,
  }));

const totaux = (items) => {
  const collecte = items.reduce((s, i) => s + (i.quantiteCollectee || 0), 0);
  const remis = items.reduce((s, i) => s + (i.quantiteRemise || 0), 0);
  return {
    collecte,
    remis,
    reste: Math.max(collecte - remis, 0),
    pourcentage: collecte > 0 ? Math.round((remis / collecte) * 100) : 0,
  };
};

export const RemiseLingeContext = createContext();
export const useRemiseLinge = () => useContext(RemiseLingeContext);

export function RemiseLingeProvider({ children }) {
  const { showAlert } = useModal();

  // États
  const [agentRemise, setAgentRemise] = useState(null);
  const [agentCollecte, setAgentCollecte] = useState(null);
  const [remise, setRemise] = useState(null);
  const [collecteId, setCollecteId] = useState(null);
  const [statut, setStatut] = useState(null);
  const [remises, setRemises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scanStatus, setScanStatus] = useState(null);
  const [etape, setEtape] = useState("AGENT_REMISE");
  // Aperçu des collectes non clôturées de l'agent de collecte (avant création)
  const [apercu, setApercu] = useState(null);
  const [serviceChoisi, setServiceChoisi] = useState(null);
  const [items, setItems] = useState([]);
  // Linges remis pendant cette séance (pour pouvoir annuler d'un clic)
  const [lingesRemis, setLingesRemis] = useState([]);

  // ✅ Initialisation de l'agent depuis localStorage
  useEffect(() => {
    const agentData = getAgentFromStorage();
    if (agentData) {
      setAgentRemise(agentData);
      setEtape("AGENT_COLLECTE");
    }
  }, []);

  const scanAgentRemise = useCallback(async (code) => {
    setLoading(true);
    try {
      const agent = await fetchAgentByMatricule(code);
      setAgentRemise(agent);
      setEtape("AGENT_COLLECTE");
      return agent;
    } catch (error) {
      throw new Error(`Agent [${code}] introuvable`);
    } finally {
      setLoading(false);
    }
  }, []);

   const scanAgentCollecte = useCallback(async (code, agentRemiseData) => {
    if (!agentRemiseData) {
      throw new Error("Aucun agent de remise sélectionné");
    }

    setLoading(true);
    try {
      // Récupérer l'agent de collecte
      const agent = await fetchAgentByMatricule(code);
      setAgentCollecte(agent);

      // Aperçu AVANT de créer la remise : collectes non clôturées de cet agent
      const data = await fetchCollectesNonCloturees(agent.id);
      setApercu(data);
      // Un seul service : choisi d'office (et non envoyé à la création)
      setServiceChoisi(data.services.length === 1 ? data.services[0].serviceId : null);
      setEtape("APERCU");
      return { agent, apercu: data };
    } catch (error) {
      console.error("❌ Erreur aperçu collectes:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Charger le statut
  const chargerStatut = useCallback(async (id) => {
    if (!id) return null;
    try {
      const data = await fetchStatutCollecte(id);
      setStatut(data);
      return data;
    } catch (error) {
      console.error("Erreur chargement statut:", error);
      return null;
    }
  }, []);

  // ✅ Charger l'historique
  const chargerHistorique = useCallback(async (id) => {
    if (!id) return;
    try {
      const data = await fetchHistoriqueRemises(id);
      setRemises(data);
    } catch (error) {
      console.error("Erreur chargement historique:", error);
    }
  }, []);

  // ✅ Recharger l'aperçu des collectes (les collectes compensées disparaissent)
  const chargerApercu = useCallback(async (personnelId) => {
    if (personnelId == null) return null;
    try {
      const data = await fetchCollectesNonCloturees(personnelId);
      setApercu(data);
      return data;
    } catch (error) {
      console.error("Erreur chargement aperçu:", error);
      return null;
    }
  }, []);

  // ✅ Détail de la remise : état + items (si le backend les renvoie)
  const chargerRemise = useCallback(async (id) => {
    if (!id) return null;
    try {
      const data = await fetchRemiseById(id);
      setRemise(data);
      const list = itemsDeRemise(data);
      if (list.length) setItems(list);
      return data;
    } catch (error) {
      console.error("Erreur chargement remise:", error);
      return null;
    }
  }, []);

  // ✅ Choix du service quand l'agent a des collectes ouvertes sur plusieurs services
  const choisirService = useCallback((serviceId) => {
    setServiceChoisi(serviceId);
  }, []);

  // ✅ Revenir au scan de l'agent de collecte (aucune collecte, ou mauvais agent)
  const changerAgentCollecte = useCallback(() => {
    setAgentCollecte(null);
    setApercu(null);
    setServiceChoisi(null);
    setEtape("AGENT_COLLECTE");
  }, []);

  // ✅ Création de la remise après l'aperçu (une remise = un service)
  const creerRemise = useCallback(async () => {
    if (!agentRemise || !agentCollecte || !apercu) {
      throw new Error("Agent de remise ou agent de collecte manquant");
    }
    if (!apercu.nbCollectes) {
      throw new Error("Aucune collecte non clôturée pour cet agent : aucune remise à créer.");
    }
    const plusieursServices = apercu.services.length > 1;
    if (plusieursServices && serviceChoisi == null) {
      throw new Error("Choisissez le service de la remise.");
    }

    setLoading(true);
    try {
      // L'API attend: matriculeAgentRemise (String), id (Long, personnel de collecte)
      // et serviceId uniquement si plusieurs services sont possibles
      const remiseData = await createRemise(
        agentRemise.matricule,
        agentCollecte.id,
        plusieursServices ? serviceChoisi : null
      );

      setRemise(remiseData);
      setCollecteId(remiseData.collecte?.id);

      const service = apercu.services.find((s) => s.serviceId === (serviceChoisi ?? remiseData.service));
      const initiaux = itemsDeRemise(remiseData);
      setItems(initiaux.length ? initiaux : itemsDepuisApercu(service?.resteParCategorie));

      await Promise.all([
        initiaux.length ? null : chargerRemise(remiseData.id),
        chargerHistorique(remiseData.collecte?.id),
      ]);

      setEtape("SCAN");
      return remiseData;
    } finally {
      setLoading(false);
    }
  }, [agentRemise, agentCollecte, apercu, serviceChoisi, chargerRemise, chargerHistorique]);

  // ✅ Scanner un linge
  const scanLinge = useCallback(async (code) => {
    if (!code?.trim() || !remise?.id) {
      throw new Error("Code invalide ou remise non initialisée");
    }

    setScanStatus({ loading: true, code: code.trim() });

    try {
      // Réponse = item de la catégorie scannée (quantiteCollectee / quantiteRemise)
      const data = await scanLingeForRemise(remise.id, code.trim());

      const nouveauxItems = items.some((i) => i.categorie === data.categorie)
        ? items.map((i) => (i.categorie === data.categorie ? { ...i, ...data } : i))
        : [...items, data];
      setItems(nouveauxItems);
      setLingesRemis((l) => [
        { codeBarre: code.trim(), categorie: data.categorie, date: new Date() },
        ...l.filter((x) => x.codeBarre !== code.trim()),
      ]);

      // Le serveur impute le linge à la collecte la plus ancienne et clôture
      // les collectes compensées : on rafraîchit la remise, l'aperçu et l'historique
      await Promise.all([
        chargerRemise(remise.id),
        chargerApercu(agentCollecte?.id),
        chargerHistorique(collecteId),
      ]);

      const quantiteRestante =
        data.quantiteRestante ?? Math.max((data.quantiteCollectee || 0) - (data.quantiteRemise || 0), 0);

      setScanStatus({
        loading: false,
        success: {
          codeBarre: code.trim(),
          categorie: data.categorie,
          quantiteRemise: data.quantiteRemise,
          quantiteRestante
        },
        error: null
      });

      return {
        data,
        isComplete: totaux(nouveauxItems).reste === 0
      };
    } catch (error) {
      setScanStatus({
        loading: false,
        success: null,
        error: error.message
      });
      throw error;
    }
  }, [remise, items, agentCollecte, collecteId, chargerRemise, chargerApercu, chargerHistorique]);

  // ✅ Annuler la remise d'un linge (scanné par erreur) : il retrouve son état d'avant
  const annulerLinge = useCallback(async (code) => {
    if (!code?.trim() || !remise?.id) {
      throw new Error("Code invalide ou remise non initialisée");
    }
    const codeBarre = code.trim();
    setScanStatus({ loading: true, code: codeBarre });
    try {
      const data = await annulerLingeRemise(remise.id, codeBarre);
      setItems((prev) => prev.map((i) => (i.categorie === data.categorie ? { ...i, ...data } : i)));
      setLingesRemis((l) => l.filter((x) => x.codeBarre !== codeBarre));

      // La collecte imputée peut être rouverte : on rafraîchit tout
      await Promise.all([
        chargerRemise(remise.id),
        chargerApercu(agentCollecte?.id),
        chargerHistorique(collecteId),
      ]);

      setScanStatus({
        loading: false,
        success: { codeBarre, categorie: data.categorie, annule: true },
        error: null
      });
      return data;
    } catch (error) {
      setScanStatus({ loading: false, success: null, error: error.message });
      throw error;
    }
  }, [remise, agentCollecte, collecteId, chargerRemise, chargerApercu, chargerHistorique]);

  // ✅ Rafraîchir les données
  const rafraichir = useCallback(async () => {
    await Promise.all([
      remise?.id ? chargerRemise(remise.id) : null,
      chargerApercu(agentCollecte?.id),
      collecteId ? chargerHistorique(collecteId) : null,
    ]);
  }, [remise, agentCollecte, collecteId, chargerRemise, chargerApercu, chargerHistorique]);

  // ✅ Nouvelle remise (ex. pour le reste après une remise partielle) : garde l'agent de remise
  const nouvelleRemise = useCallback(() => {
    setRemise(null);
    setCollecteId(null);
    setRemises([]);
    setItems([]);
    setLingesRemis([]);
    setScanStatus(null);
    setAgentCollecte(null);
    setApercu(null);
    setServiceChoisi(null);
    setEtape("AGENT_COLLECTE");
  }, []);

  // ✅ Réinitialiser
  const resetAll = useCallback(() => {
    setAgentRemise(null);
    setAgentCollecte(null);
    setRemise(null);
    setCollecteId(null);
    setStatut(null);
    setRemises([]);
    setScanStatus(null);
    setApercu(null);
    setServiceChoisi(null);
    setItems([]);
    setLingesRemis([]);
    setEtape("AGENT_REMISE");
  }, []);

  // ✅ Effacer le statut de scan
  const clearScanStatus = useCallback(() => {
    setScanStatus(null);
  }, []);

  const value = {
    // États
    agentRemise,
    agentCollecte,
    remise,
    collecteId,
    statut,
    remises,
    loading,
    scanStatus,
    etape,
    apercu,
    serviceChoisi,
    items,
    lingesRemis,
    totaux: totaux(items),
    // Remise terminée : tout le reste à remettre a été scanné
    isCloturee: items.length > 0 && totaux(items).reste === 0,

    // Actions
    scanAgentRemise,
    scanAgentCollecte,
    choisirService,
    changerAgentCollecte,
    creerRemise,
    nouvelleRemise,
    scanLinge,
    annulerLinge,
    chargerStatut,
    chargerHistorique,
    rafraichir,
    resetAll,
    clearScanStatus,
  };

  return (
    <RemiseLingeContext.Provider value={value}>
      {children}
    </RemiseLingeContext.Provider>
  );
}