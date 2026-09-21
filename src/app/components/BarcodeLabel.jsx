import React from "react";
import printJS from "print-js";
import { useTranslation } from "react-i18next";

export const BarcodeLabel = ({ item, type = "default" }) => {
  const { t } = useTranslation();

  const detectFormat = (value) => {
    if (!value) return "code128";
    const cleanValue = value.replace(/\s+/g, "");
    if (/^\d{13}$/.test(cleanValue)) return "ean13";
    if (/^\d{8}$/.test(cleanValue)) return "ean8";
    if (/^\d{12}$/.test(cleanValue)) return "upc";
    return "code128";
  };

  // ✅ Récupérer le code selon le type
  const getCode = () => {
    if (!item) return "";

    if (type === "sac") {
      return item.numeroSac || item.code || `ID-${item.id}`;
    }
    if (type === "lit") {
      return item.code || item.codeBarre || `LIT-${item.id}`;
    }
    if (type === "chambre") {
      return item.code || item.codeBarre || `CH-${item.id}`;
    }
    if (type === "bac") {
      return item.code || item.codeBarre || item.reference || `BAC-${item.id}`;
    }
    if (type === "lot") {
      return item.codeLot || item.code || `LOT-${item.id}`;
    }
    if (type === "machine") {
      return item.code || item.codeBarre || `MACH-${item.id}`;
    }

    return (
      item.codeBarre ||
      item.code ||
      item.numeroSac ||
      item.codeLot ||
      item.reference ||
      `ID-${item.id}`
    );
  };

  // ✅ Récupérer le titre secondaire selon le type
  const getSubtitle = () => {
    if (!item) return "";
    switch (type) {
      case "sac":
        return item.serviceNom || item.chambre || "";
      case "chambre":
        return item.serviceNom || "";
      case "lit":
        return item.chambreCode || item.chambreNom || "";
      case "bac":
        return item.reference || "";
      case "lot":
        return item.categorie || "";
      case "machine":
        return item.designation || item.marque || "";
      case "linge":
        return item.categorie || "";
      default:
        return item.designation || item.categorie || "";
    }
  };

  const handlePrint = () => {
    if (!item) return;

    const code = getCode();
    const format = detectFormat(code);
    const labelType = t(`barcode_label.types.${type}`, t("barcode_label.types.default"));
    const subtitle = getSubtitle();
    const currentDate = new Date().toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    // ✅ Couleur par type d'article (design unique)
    const TYPE_COLORS = {
      sac: { primary: "#dc2626", light: "#fef2f2", border: "#fecaca", icon: "☣" },
      chambre: { primary: "#ec4899", light: "#fdf2f8", border: "#fbcfe8", icon: "🏠" },
      lit: { primary: "#2563eb", light: "#eff6ff", border: "#bfdbfe", icon: "🛏" },
      bac: { primary: "#d97706", light: "#fffbeb", border: "#fcd34d", icon: "🧺" },
      lot: { primary: "#7c3aed", light: "#f5f3ff", border: "#ddd6fe", icon: "📦" },
      machine: { primary: "#0d9488", light: "#f0fdfa", border: "#99f6e4", icon: "⚙" },
      linge: { primary: "#0ca678", light: "#ecfdf5", border: "#a7f3d0", icon: "👕" },
      default: { primary: "#475569", light: "#f8fafc", border: "#e2e8f0", icon: "🏷" },
    };

    const theme = TYPE_COLORS[type] || TYPE_COLORS.default;

    printJS({
      printable: `
        <div style="
          width: 90mm;
          height: 60mm;
          padding: 5mm;
          font-family: 'Segoe UI', 'Arial', sans-serif;
          background: white;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
        ">
          <!-- Bande colorée gauche -->
          <div style="
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 3mm;
            background: ${theme.primary};
          "></div>

          <!-- HEADER -->
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 2mm;
            border-bottom: 1.5pt solid ${theme.primary};
            margin-left: 3mm;
            margin-bottom: 3mm;
          ">
            <!-- Type d'article -->
            <div style="
              display: flex;
              align-items: center;
              gap: 2mm;
            ">
              <div style="
                width: 8mm;
                height: 8mm;
                border-radius: 2mm;
                background: ${theme.primary};
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 12pt;
                font-weight: 800;
              ">
                ${theme.icon}
              </div>
              <div>
                <div style="
                  font-size: 11pt;
                  font-weight: 800;
                  color: ${theme.primary};
                  text-transform: uppercase;
                  letter-spacing: 0.5pt;
                  line-height: 1;
                ">
                  ${labelType}
                </div>
                ${subtitle ? `
                  <div style="
                    font-size: 7pt;
                    color: #64748b;
                    font-weight: 600;
                    margin-top: 0.5mm;
                    text-transform: uppercase;
                    letter-spacing: 0.3pt;
                  ">
                    ${subtitle}
                  </div>
                ` : ""}
              </div>
            </div>

            <!-- Date -->
            <div style="
              font-size: 7pt;
              color: #64748b;
              font-weight: 600;
              text-align: right;
              line-height: 1.3;
            ">
              ${currentDate}
            </div>
          </div>

          <!-- CODE-BARRE -->
          <div style="
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-left: 3mm;
            padding: 2mm 0;
          ">
            <img
              src="https://barcodeapi.org/api/${format}/${encodeURIComponent(code)}"
              style="
                height: 70px;
                max-width: 100%;
                display: block;
              "
              alt="Code-barres"
            />
          </div>

          <!-- CODE TEXTE -->
          <div style="
            background: ${theme.light};
            border: 1pt solid ${theme.border};
            border-radius: 2mm;
            padding: 2mm 3mm;
            margin-left: 3mm;
            text-align: center;
          ">
            <div style="
              font-family: 'Courier New', monospace;
              font-size: 12pt;
              font-weight: 800;
              color: #0f172a;
              letter-spacing: 1pt;
            ">
              ${code}
            </div>
          </div>

          <!-- FOOTER -->
          <div style="
            margin-top: 2mm;
            margin-left: 3mm;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 6pt;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.4pt;
            font-weight: 700;
          ">
            <span>Polyclinique Ibn Khaldoun</span>
            <span>•</span>
            <span>SoftSys Laundry</span>
          </div>
        </div>
      `,
      type: "raw-html",
      style: `
        * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        @page {
          size: 90mm 60mm;
          margin: 0;
        }
        body {
          margin: 0;
          padding: 0;
          width: 90mm;
          height: 60mm;
        }
      `,
      documentTitle: `${labelType}_${code}`,
    });
  };

  return (
    <button
      onClick={handlePrint}
      className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#8b5cf6]/30 rounded-[14px] text-sm font-bold text-[#8b5cf6] hover:bg-[#8b5cf6]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02]"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M9 15l-2-2 2-2" />
        <path d="M15 9l2 2-2 2" />
        <path d="M10 11l2 2 2-2" />
      </svg>
      {t("barcode_label.print")}
    </button>
  );
};

export default BarcodeLabel;