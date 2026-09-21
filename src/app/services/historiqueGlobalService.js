const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

// ─── Récupérer l'historique global paginé ──────────────────────────────
export const fetchGlobalHistory = async (
  { page = 0, size = 10, sortBy = "dateOperation", direction = "desc" } = {},
  signal
) => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sortBy,
      direction,
    });

    const res = await fetch(
      `${API_BASE_URL}/api/linges/historique/historique-global?${params}`,
      { signal }
    );

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();

    if (Array.isArray(data)) {
      return {
        data,
        currentPage: 0,
        totalItems: data.length,
        totalPages: 1,
        pageSize: data.length,
        isFirst: true,
        isLast: true,
      };
    }

    return {
      data: data.content ?? [],
      currentPage: data.number ?? 0,
      totalItems: data.totalElements ?? 0,
      totalPages: data.totalPages ?? 0,
      pageSize: data.size ?? size,
      isFirst: data.first ?? true,
      isLast: data.last ?? true,
    };
  } catch (err) {
    if (err.name === "AbortError") return null;
    console.error("Erreur fetch historique global :", err);
    return {
      data: [],
      currentPage: 0,
      totalItems: 0,
      totalPages: 0,
      pageSize: size,
      isFirst: true,
      isLast: true,
    };
  }
};

// ─── Récupérer un personnel par ID ─────────────────────────────────────
export const fetchPersonnelById = async (personnelId) => {
  if (!personnelId) return null;
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/sqlserver/personnel/${personnelId}`,
      { headers: { accept: "*/*" } }
    );
    if (!res.ok) {
      console.warn(`Personnel ${personnelId} introuvable (${res.status})`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error(`Erreur fetch personnel ${personnelId} :`, err);
    return null;
  }
};

// ─── Récupérer plusieurs personnels en batch ───────────────────────────
export const fetchPersonnelsByIds = async (ids) => {
  if (!ids || ids.length === 0) return {};

  const uniqueIds = [...new Set(ids.filter((id) => id != null))];

  const results = await Promise.all(
    uniqueIds.map(async (id) => {
      const data = await fetchPersonnelById(id);
      return [id, data];
    })
  );

  const cache = {};
  results.forEach(([id, data]) => {
    if (data) cache[id] = data;
  });
  return cache;
};

// ─── Formater une date ─────────────────────────────────────────────────
export const formatDate = (dateString) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ─── Extraire le nom depuis un objet personnel ─────────────────────────
export const getPersonnelNom = (personnel) => {
  if (!personnel) return null;
  return (
    personnel.nomPrenom ||
    personnel.nomComplet ||
    personnel.nom_prenom ||
    (personnel.nom || personnel.prenom
      ? `${personnel.prenom ?? ""} ${personnel.nom ?? ""}`.trim()
      : null) ||
    personnel.matricule ||
    null
  );
};