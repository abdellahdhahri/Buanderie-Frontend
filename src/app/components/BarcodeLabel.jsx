import React from "react";
import printJS from "print-js";

export const BarcodeLabel = ({ item }) => {
  const detectFormat = (value) => {
    if (!value) return "code128";
    const cleanValue = value.replace(/\s+/g, "");
    if (/^\d{13}$/.test(cleanValue)) return "ean13";
    if (/^\d{8}$/.test(cleanValue)) return "ean8";
    if (/^\d{12}$/.test(cleanValue)) return "upc";
    return "code128";
  };

  const handlePrint = () => {
    if (!item) return;

    // Récupérer le code selon le type d'item
    let code = item.codeBarre || item.code || item.codeLot || item.reference || `ID-${item.id}`;
    const format = detectFormat(code);

    printJS({
      printable: `
        <div style="width:50mm; padding:2mm; font-family:'Courier New',monospace; background:white; text-align:center;">
          <div style="display:flex; justify-content:center; margin:1mm 0;">
            <img
              src="https://barcodeapi.org/api/${format}/${encodeURIComponent(code)}"
              style="height:50px;"
              alt="Code-barres"
            />
          </div>
          <div style="font-size:7pt; color:#666; border-top:0.5pt solid #ddd; padding-top:1mm; margin-top:1mm;">
            ${code}
          </div>
        </div>
      `,
      type: "raw-html",
      style: "* { margin: 0; padding: 0; box-sizing: border-box; }",
      documentTitle: `Code_${code}`,
    });
  };

  return (
    <button
      onClick={handlePrint}
      className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#8b5cf6]/30 rounded-[14px] text-sm font-bold text-[#8b5cf6] hover:bg-[#8b5cf6]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02]"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M9 15l-2-2 2-2" />
        <path d="M15 9l2 2-2 2" />
        <path d="M10 11l2 2 2-2" />
      </svg>
      Étiquette
    </button>
  );
};

export default BarcodeLabel;