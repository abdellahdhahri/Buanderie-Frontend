const normaliser = (v) => String(v || "").trim().toUpperCase();

export function programmesCandidats(programmes, categorie, nomRecommande) {
  const lavage = (programmes || []).filter((p) => p.type !== "DESINFECTION");
  const recommande = nomRecommande ? lavage.find((p) => normaliser(p.nom) === normaliser(nomRecommande)) : null;
  const defaut = lavage.find((p) => p.parDefaut) || null;

  const suggeres = lavage.filter((p) => categorie && (p.categories || []).includes(categorie));
  if (recommande && !suggeres.some((p) => p.id === recommande.id) && recommande.id !== defaut?.id) suggeres.unshift(recommande);
  suggeres.sort((a, b) => (a.id === recommande?.id ? -1 : b.id === recommande?.id ? 1 : 0));

  const defautSepare = defaut && !suggeres.some((p) => p.id === defaut.id) ? defaut : null;
  const initial = recommande || suggeres[0] || defaut || null;

  return { suggeres, defaut: defautSepare, defautId: defaut?.id ?? null, recommandeId: recommande?.id ?? null, initialId: initial?.id ?? null };
}

export function versScanInfo(lotInfo, programme, origine) {
  if (!programme) return lotInfo;
  return {
    ...(lotInfo || {}),
    programmeId: programme.id,
    programmeRecommande: programme.nom,
    temperature: programme.temperatureCelsius ?? null,
    vitesse: programme.vitesseEssorageRpm ?? null,
    niveauHumidite: programme.niveauHumidite ?? lotInfo?.niveauHumidite ?? null,
    duree: programme.dureeMinutes ?? null,
    description: programme.description || lotInfo?.description || null,
    origineProgramme: origine,
  };
}
