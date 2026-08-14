import React from 'react';
import Barcode from 'react-barcode';


const BarcodeLabel = React.forwardRef(({ linge }, ref) => {
  if (!linge) return null;

  const detectFormat = (value) => {
    if (!value) return "CODE128";
    const cleanValue = value.replace(/\s+/g, '');
    
    if (/^\d{13}$/.test(cleanValue)) return "EAN13";
    if (/^\d{8}$/.test(cleanValue)) return "EAN8";
    if (/^\d{12}$/.test(cleanValue)) return "UPC";
    
    return "CODE128"; 
  };

  const format = detectFormat(linge.codeSuivi);

  return (
    <div ref={ref} className="print-label-container">
      <div className="label-header">
        {/*<span className="label-brand">BUANDERIE GESTION</span>*/}
        <span className="label-date">{new Date().toLocaleDateString()}</span>
      </div>
      
      <div className="barcode-section">
        <Barcode 
          value={linge.codeSuivi} 
          format={format}
          width={format.startsWith('EAN') ? 1.8 : 2.2} 
          height={60} 
          fontSize={10}
          margin={10}
          background="#ffffff"
        />
      </div>
      
      <div className="label-details">
        <div className="detail-row">
          <span><strong>ID:</strong> {linge.id}</span>
          <span><strong>Pièce:</strong> {linge.categorie}</span>
        </div>
        <div className="detail-row">
          <span><strong>Service:</strong> {linge.serviceNom || 'N/A'}</span>
          <span><strong>Ch:</strong> {linge.chambre || '-'}</span>
        </div>
      </div>

      <style>{`
        @media screen {
          .print-label-container {
            display: none; /* Hide from screen by default */
          }
        }
        
        @media print {
          .print-label-container {
            display: block !important;
            width: 50mm;
            height: 30mm;
            padding: 2mm;
            box-sizing: border-box;
            background: white;
            font-family: 'Courier New', Courier, monospace;
            overflow: hidden;
            page-break-after: always;
          }

          .label-header {
            display: flex;
            justify-content: space-between;
            font-size: 7pt;
            border-bottom: 0.5pt solid black;
            margin-bottom: 1mm;
            padding-bottom: 0.5mm;
          }

          .barcode-section {
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 1mm 0;
          }

          .label-details {
            font-size: 8pt;
            line-height: 1.1;
          }

          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.5mm;
          }

          .label-brand { font-weight: bold; }
        }
      `}</style>
    </div>
  );
});

export default BarcodeLabel;
