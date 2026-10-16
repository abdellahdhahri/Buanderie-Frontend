/* ═══════════════════════════════════════════════════════════════════════════
   EXPORT EXCEL (.xlsx) — sans dépendance.
   Un .xlsx est une archive ZIP de fichiers XML : on l'écrit directement
   (archive non compressée), avec en-tête stylé, ligne figée, filtres
   automatiques et largeurs de colonnes.

   exportXlsx({
     fileName: "linges.xlsx",
     sheets: [{
       name: "Linges",
       columns: [{ header: "Code", key: "code", width: 18, type: "text" | "number" | "integer" | "date" }],
       rows: [{ code: "123" }],
     }],
   });
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── ZIP (méthode « stockée ») ─────────────────────────────────────────── */
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function zip(files) {
  const enc = new TextEncoder();
  const chunks = [];
  const central = [];
  let offset = 0;
  // Date DOS fixe (l'heure n'a pas d'importance pour Excel)
  const dosTime = 0, dosDate = ((2020 - 1980) << 9) | (1 << 5) | 1;

  for (const { name, content } of files) {
    const nameBytes = enc.encode(name);
    const data = typeof content === "string" ? enc.encode(content) : content;
    const crc = crc32(data);

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true); // noms en UTF-8
    local.setUint16(8, 0, true);      // stocké
    local.setUint16(10, dosTime, true);
    local.setUint16(12, dosDate, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, nameBytes.length, true);
    local.setUint16(28, 0, true);
    chunks.push(new Uint8Array(local.buffer), nameBytes, data);

    const cd = new DataView(new ArrayBuffer(46));
    cd.setUint32(0, 0x02014b50, true);
    cd.setUint16(4, 20, true);
    cd.setUint16(6, 20, true);
    cd.setUint16(8, 0x0800, true);
    cd.setUint16(10, 0, true);
    cd.setUint16(12, dosTime, true);
    cd.setUint16(14, dosDate, true);
    cd.setUint32(16, crc, true);
    cd.setUint32(20, data.length, true);
    cd.setUint32(24, data.length, true);
    cd.setUint16(28, nameBytes.length, true);
    cd.setUint32(42, offset, true);
    central.push(new Uint8Array(cd.buffer), nameBytes);

    offset += 30 + nameBytes.length + data.length;
  }

  const centralSize = central.reduce((s, b) => s + b.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, offset, true);

  return new Blob([...chunks, ...central, new Uint8Array(end.buffer)], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

/* ── XML du classeur ───────────────────────────────────────────────────── */
const esc = (v) =>
  String(v ?? "")
    // caractères de contrôle interdits en XML
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const colName = (i) => {
  let s = "";
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
};

// Index des styles définis dans styles.xml
const STYLE = { text: 0, header: 1, number: 2, integer: 3, date: 4, title: 5, subtitle: 6 };

// Date JS → numéro de série Excel
const excelDate = (d) => {
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return null;
  return (date.getTime() - date.getTimezoneOffset() * 60000) / 86400000 + 25569;
};

function cell(ref, value, type) {
  if (value === null || value === undefined || value === "") return `<c r="${ref}" s="${STYLE.text}"/>`;
  if (type === "number" || type === "integer") {
    const n = Number(value);
    if (Number.isFinite(n)) return `<c r="${ref}" s="${STYLE[type]}"><v>${n}</v></c>`;
  }
  if (type === "date") {
    const serial = excelDate(value);
    if (serial != null) return `<c r="${ref}" s="${STYLE.date}"><v>${serial}</v></c>`;
  }
  return `<c r="${ref}" s="${STYLE.text}" t="inlineStr"><is><t xml:space="preserve">${esc(value)}</t></is></c>`;
}

function sheetXml({ columns, rows, title, subtitle }) {
  const lastCol = colName(columns.length - 1);
  const xmlRows = [];
  let r = 1;

  // Titre facultatif au-dessus du tableau
  if (title) {
    xmlRows.push(`<row r="${r}" ht="24" customHeight="1"><c r="A${r}" s="${STYLE.title}" t="inlineStr"><is><t>${esc(title)}</t></is></c></row>`);
    r++;
    if (subtitle) {
      xmlRows.push(`<row r="${r}"><c r="A${r}" s="${STYLE.subtitle}" t="inlineStr"><is><t>${esc(subtitle)}</t></is></c></row>`);
      r++;
    }
    r++; // ligne vide
  }

  const headerRow = r;
  xmlRows.push(
    `<row r="${r}" ht="22" customHeight="1">` +
      columns.map((c, i) => `<c r="${colName(i)}${r}" s="${STYLE.header}" t="inlineStr"><is><t>${esc(c.header)}</t></is></c>`).join("") +
      `</row>`
  );
  r++;
  rows.forEach((row) => {
    xmlRows.push(`<row r="${r}">` + columns.map((c, i) => cell(`${colName(i)}${r}`, row[c.key], c.type)).join("") + `</row>`);
    r++;
  });
  const lastRow = Math.max(headerRow, r - 1);

  const cols = columns.map((c, i) => `<col min="${i + 1}" max="${i + 1}" width="${c.width || 14}" customWidth="1"/>`).join("");
  const pane = `<pane ySplit="${headerRow}" topLeftCell="A${headerRow + 1}" activePane="bottomLeft" state="frozen"/>`;

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheetViews><sheetView workbookViewId="0" rightToLeft="0">${pane}</sheetView></sheetViews>
<sheetFormatPr defaultRowHeight="16"/>
<cols>${cols}</cols>
<sheetData>${xmlRows.join("")}</sheetData>
${rows.length ? `<autoFilter ref="A${headerRow}:${lastCol}${lastRow}"/>` : ""}
<pageMargins left="0.4" right="0.4" top="0.5" bottom="0.5" header="0.3" footer="0.3"/>
<pageSetup orientation="landscape" fitToWidth="1" fitToHeight="0"/>
</worksheet>`;
}

const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="2"><numFmt numFmtId="164" formatCode="#,##0.00"/><numFmt numFmtId="165" formatCode="dd/mm/yyyy hh:mm"/></numFmts>
<fonts count="4">
  <font><sz val="11"/><name val="Calibri"/><family val="2"/></font>
  <font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/><family val="2"/></font>
  <font><b/><sz val="15"/><color rgb="FF0F766E"/><name val="Calibri"/><family val="2"/></font>
  <font><i/><sz val="10"/><color rgb="FF64748B"/><name val="Calibri"/><family val="2"/></font>
</fonts>
<fills count="3">
  <fill><patternFill patternType="none"/></fill>
  <fill><patternFill patternType="gray125"/></fill>
  <fill><patternFill patternType="solid"><fgColor rgb="FF0D9488"/><bgColor indexed="64"/></patternFill></fill>
</fills>
<borders count="2">
  <border><left/><right/><top/><bottom/><diagonal/></border>
  <border><left/><right/><top/><bottom style="thin"><color rgb="FFE2E8F0"/></bottom><diagonal/></border>
</borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="7">
  <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/>
  <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center"/></xf>
  <xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>
  <xf numFmtId="1" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>
  <xf numFmtId="165" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>
  <xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>
  <xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

// Nom de feuille valide pour Excel (31 caractères, sans : \ / ? * [ ])
const sheetName = (name, i) => (String(name || `Feuille ${i + 1}`).replace(/[:\\/?*[\]]/g, " ").slice(0, 31) || `Feuille ${i + 1}`);

// Ligne d'en-tête du tableau (après le titre et le sous-titre éventuels)
const headerRowOf = (s) => (s.title ? (s.subtitle ? 4 : 3) : 1);

// Plage des filtres automatiques, déclarée aussi dans le classeur
function definedNames(sheets, names) {
  const defs = sheets
    .map((s, i) => {
      if (!s.rows.length) return "";
      const h = headerRowOf(s);
      const ref = `'${esc(names[i]).replace(/'/g, "''")}'!$A$${h}:$${colName(s.columns.length - 1)}$${h + s.rows.length}`;
      return `<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">${ref}</definedName>`;
    })
    .join("");
  return defs ? `<definedNames>${defs}</definedNames>` : "";
}

export function buildXlsx(sheets) {
  const names = sheets.map((s, i) => sheetName(s.name, i));
  const files = [
    {
      name: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("\n")}
</Types>`,
    },
    {
      name: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
    },
    {
      name: "xl/workbook.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets>${names.map((n, i) => `<sheet name="${esc(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets>
${definedNames(sheets, names)}
</workbook>`,
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("\n")}
<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
    },
    { name: "xl/styles.xml", content: STYLES_XML },
    ...sheets.map((s, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, content: sheetXml(s) })),
  ];
  return zip(files);
}

export function exportXlsx({ fileName = "export.xlsx", sheets }) {
  const blob = buildXlsx(sheets);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
