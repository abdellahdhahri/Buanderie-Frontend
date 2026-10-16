

const STORAGE_KEY = "establishment";
const EVENT = "establishmentchange";

export const DEFAULT_LOGO =
  "https://cdn.polyclinique-ibnkhaldoun.com.tn/wp-content/uploads/bfi_thumb/logo-ibnkhaldoun-sfax-moyen-34qusv5ms48ltafwigpog0.png";
export const DEFAULT_LOGO_FALLBACK =
  "https://cdn.polyclinique-ibnkhaldoun.com.tn/wp-content/uploads/2019/01/LOGO-ibnkhaldoun.jpg";

export const DEFAULT_ESTABLISHMENT = {
  name: "Polyclinique Ibn Khaldoun",
  city: "Sfax",
  logo: DEFAULT_LOGO,
};

export function getEstablishment() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return { ...DEFAULT_ESTABLISHMENT, ...(saved || {}) };
  } catch {
    return { ...DEFAULT_ESTABLISHMENT };
  }
}

export function saveEstablishment(data) {
  const value = {
    name: (data.name || "").trim() || DEFAULT_ESTABLISHMENT.name,
    city: (data.city || "").trim(),
    logo: data.logo || DEFAULT_ESTABLISHMENT.logo,
  };
  // Peut échouer si le logo importé est trop lourd pour le stockage du navigateur
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(EVENT, { detail: value }));
  return value;
}

export function resetEstablishment() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* stockage indisponible */ }
  const value = { ...DEFAULT_ESTABLISHMENT };
  window.dispatchEvent(new CustomEvent(EVENT, { detail: value }));
  return value;
}

export function onEstablishmentChange(callback) {
  const handler = (e) => callback(e.detail);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}

// Réduit une image importée (max 480×200) et la renvoie en data URL PNG
export function resizeLogo(file, maxWidth = 480, maxHeight = 200) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Lecture du fichier impossible"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Image invalide"));
      img.onload = () => {
        // SVG : conservé tel quel (vectoriel, déjà léger)
        if (file.type === "image/svg+xml") return resolve(reader.result);
        const ratio = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
