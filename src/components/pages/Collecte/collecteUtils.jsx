

export const API = import.meta.env.VITE_API_URL || "http://localhost:8082";

export const CAT = {
  DRAP:             { label:"Drap",         emoji:"🛏️", color:"#dc2626", bg:"#fee2e2" },
  TAIE_OREILLER:    { label:"Taie",         emoji:"💤", color:"#ea580c", bg:"#ffedd5" },
  SERVIETTE_BAIN:   { label:"Serv. Bain",   emoji:"🛁", color:"#d97706", bg:"#fef3c7" },
  SERVIETTE_VISAGE: { label:"Serv. Visage", emoji:"🧻", color:"#65a30d", bg:"#ecfccb" },
  PEIGNOIR:         { label:"Peignoir",     emoji:"🥼", color:"#0891b2", bg:"#cffafe" },
  NAPPE:            { label:"Nappe",        emoji:"🍽️", color:"#7c3aed", bg:"#ede9fe" },
  SERVIETTE_TABLE:  { label:"Serv. Table",  emoji:"🍴", color:"#be185d", bg:"#fce7f3" },
  UNIFORME:         { label:"Uniforme",     emoji:"👔", color:"#0f766e", bg:"#ccfbf1" },
  AUTRE:            { label:"Autre",        emoji:"📦", color:"#475569", bg:"#f1f5f9" },
};
export const cat = (id) => CAT[id] || { label:id||"?", emoji:"📦", color:"#64748b", bg:"#f1f5f9" };

export const ST_COLORS = {
  BLANC:           { b:"#bbf7d0", bg:"#f0fdf4", tag:"#dcfce7", tc:"#15803d", lbl:"✅ Blanc"    },
  INFECTE_PRESUME: { b:"#fca5a5", bg:"#fff5f5", tag:"#fee2e2", tc:"#dc2626", lbl:"🔴 Infecté" },
  PROPRE:          { b:"#bae6fd", bg:"#f0f9ff", tag:"#dbeafe", tc:"#0284c7", lbl:"🔵 Propre"  },
  MANQUANT:        { b:"#fde68a", bg:"#fffbeb", tag:"#fef3c7", tc:"#d97706", lbl:"⚠️ Manquant"},
};

/** Helper fetch avec query params */
export async function apiCall(path, params={}, method="POST", body=null) {
  const url = new URL(`${API}${path}`);
  Object.entries(params).forEach(([k,v]) => v!=null && url.searchParams.set(k,String(v)));
  const opts = { method };
  if (body) { opts.headers={"Content-Type":"application/json"}; opts.body=JSON.stringify(body); }
  const r = await fetch(url.toString(), opts);
  if (!r.ok) { const t=await r.text(); let m=t; try{m=JSON.parse(t).message||t;}catch{}; throw new Error(m); }
  return r.json();
}
