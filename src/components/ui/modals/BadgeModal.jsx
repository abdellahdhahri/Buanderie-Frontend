import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import './BadgeModal.css';
import Button from '../Badge/Button';
import logoSoftsys from '../../../assets/logo_SoftSys.png';

const staticEmployee = {
    nom: "administrateur ",
    prenom: "",
    fonction: "",
    matricule: "",
    service: "Buanderie",
    codeBarre: "P0000025",
    photo: null
};

const RealBarcode = ({ value }) => {
    const [dataUrl, setDataUrl] = useState("");

    useEffect(() => {
        if (!value) return;
        try {
            const canvas = document.createElement("canvas");
            JsBarcode(canvas, String(value), {
                format: "CODE128",
                width: 2.5,
                height: 80,
                displayValue: false,
                margin: 0,
                background: "transparent",
                lineColor: "#000000",
            });
            setDataUrl(canvas.toDataURL("image/png"));
        } catch (err) {
            console.error("Erreur JsBarcode:", err);
        }
    }, [value]);

    if (!dataUrl) return null;

    return (
        <img
            src={dataUrl}
            alt="Code-barres"
            style={{
                width: "100%",
                height: "100%",
                objectFit: "fill",
                imageRendering: "pixelated",
                display: "block",
                background: "transparent",
            }}
        />
    );
};

const RealQRCode = ({ value }) => {
    const [dataUrl, setDataUrl] = useState("");

    useEffect(() => {
        if (!value) return;
        QRCode.toDataURL(String(value), {
            margin: 0,
            width: 200,
            color: {
                dark: "#000000",
                light: "#ffffff"
            }
        })
            .then(setDataUrl)
            .catch((err) => console.error("Erreur QRCode:", err));
    }, [value]);

    if (!dataUrl) return null;

    return (
        <img
            src={dataUrl}
            alt="QR code"
            style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                display: "block",
            }}
        />
    );
};

const BadgeModal = ({ isOpen, onClose }) => {

    const employee = staticEmployee;

    const printRef = useRef();

    const [colors, setColors] = useState({
        primary: '#185ea5',
        secondary: '#4895d0',
        tertiary: '#9ac4e6'
    });
    const [customLogo, setCustomLogo] = useState(logoSoftsys);

    const handlePrint = () => {
        const printWin = window.open('', '_blank', 'width=600,height=900');
        if (!printWin) {
            window.print();
            return;
        }

        const previewEl = printRef.current;
        if (!previewEl) { printWin.close(); return; }

        const clone = previewEl.cloneNode(true);

        const cssVars = `
            --badge-primary: ${colors.primary};
            --badge-secondary: ${colors.secondary};
            --badge-tertiary: ${colors.tertiary};
        `;

        printWin.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Badge</title>
<style>
@page { size: 54mm 85.6mm; margin: 0; }

*, *::before, *::after { 
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
}

html, body {
    margin: 0; padding: 0;
    background: transparent !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
}

.badge-preview-area {
    display: block;
    padding: 0; margin: 0;
    background: transparent !important;
}

.badge-card {
    width: 54mm;
    height: 85.6mm;
    background: white;
    border-radius: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    position: relative;
    page-break-after: always;
    break-after: page;
    page-break-inside: avoid;
    break-inside: avoid;
    margin: 0; padding: 0;
    border: none;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
}

.badge-decoration {
    height: 20mm;
    position: absolute;
    overflow: hidden;
    flex-shrink: 0;
    width: 100%;
}
.badge-decoration.badge-top { top: 0; left: 0; z-index: 0; }
.badge-decoration.badge-bottom { bottom: 0; left: 0; z-index: 0; }

.wave-svg { width: 100%; height: 100%; display: block; }
.bottom-wave { transform: rotate(180deg); }

.badge-content, .back-content {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    z-index: 10;
    position: relative;
    box-sizing: border-box;
    padding-top: 3mm;
}

.badge-logo-area { margin-bottom: 2mm; margin-top: 2mm; }
.badge-logo-area.small { margin-bottom: 3mm; transform: scale(0.85); }
.softsys-logo-img { height: 10mm; margin-left: 5mm; width: auto; object-fit: contain; }

.badge-photo-container {
    width: 19mm; height: 19mm;
    border-radius: 50%;
    border: 0.7mm solid ${colors.primary};
    box-shadow: 0 1mm 3mm rgba(0,0,0,.15);
    overflow: hidden; background: #e2e8f0;
    margin: 0 auto 2mm;
    display: flex; justify-content: center; align-items: center;
}
.badge-photo { width: 100%; height: 100%; object-fit: cover; }
.badge-photo-placeholder {
    width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    color: #475569; font-size: 8mm; font-weight: 600; background: #e2e8f0;
    font-family: Arial, sans-serif;
}

.badge-card-info { text-align: center; width: 100%; margin-bottom: 2mm; }
.badge-name { margin: 0 0 1mm 0; font-size: 4mm; color: #000; font-weight: 700; font-family: Arial, sans-serif; }
.badge-role { margin: 0; font-size: 2.5mm; font-weight: 700; letter-spacing: 1mm; text-transform: uppercase; color: ${colors.primary}; font-family: Arial, sans-serif; }
.badge-divider { width: 70%; height: 0.5mm; margin: 1.5mm auto; background: ${colors.tertiary}; }
.badge-matricule { margin: 0 0 1mm 0; font-size: 3mm; font-weight: 700; color: ${colors.primary}; font-family: Arial, sans-serif; }
.badge-company { margin: 0; font-size: 2.5mm; font-weight: 700; letter-spacing: 0.3mm; text-transform: uppercase; color: ${colors.primary}; font-family: Arial, sans-serif; }

.badge-codes {
    display: flex; justify-content: center; gap: 3mm; align-items: center;
    width: 100%; margin-top: auto; padding-bottom: 15mm;
    background: transparent !important;
}

.barcode-placeholder {
    width: 30mm;
    height: 10mm;
    background: transparent !important;
    padding: 0 !important;
    margin: 0 !important;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border: none !important;
}
.barcode-placeholder img,
.barcode-placeholder svg {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: fill;
    background: transparent !important;
    padding: 0 !important;
    margin: 0 !important;
    border: none !important;
    shape-rendering: crispEdges;
}

.qrcode-placeholder { width: 11mm; height: 11mm; padding: 0.5mm; background: #fff; }
.qr-squares {
    width: 100%; height: 100%;
    background: url('data:image/svg+xml;utf8,<svg width="60" height="60" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="20" height="20" fill="%23000"/><rect x="40" y="0" width="20" height="20" fill="%23000"/><rect x="0" y="40" width="20" height="20" fill="%23000"/><rect x="5" y="5" width="10" height="10" fill="%23fff"/><rect x="45" y="5" width="10" height="10" fill="%23fff"/><rect x="5" y="45" width="10" height="10" fill="%23fff"/><rect x="25" y="10" width="10" height="10" fill="%23000"/><rect x="40" y="40" width="10" height="10" fill="%23000"/><rect x="25" y="30" width="25" height="10" fill="%23000"/><rect x="10" y="25" width="10" height="10" fill="%23000"/></svg>') center/cover;
}

.terms-title {
    margin: 0 0 3mm 0;
    font-size: 3.2mm;
    font-weight: 800;
    text-align: center;
    color: ${colors.primary};
    font-family: Arial, sans-serif;
    letter-spacing: 0.3mm;
}

.terms-list {
    margin: 0;
    padding: 0 2mm;
    font-size: 2mm;
    line-height: 1.55;
    color: #333;
    text-align: center;
    font-family: Arial, sans-serif;
    font-weight: 600;
}

.terms-list li {
    margin-bottom: 2mm;
    list-style-type: none;
}

.signature-area { width: 100%; margin-top: auto; display: flex; justify-content: flex-end; padding-right: 2mm; margin-bottom: 5mm; }
.signature-placeholder { width: 25mm; height: 12mm; }
.signature-placeholder svg { width: 100%; height: 100%; }
</style>
</head>
<body style="background:transparent;">
<div class="badge-preview-area" style="${cssVars}">
${clone.innerHTML}
</div>
</body>
</html>`);

        printWin.document.close();
        printWin.focus();

        setTimeout(() => {
            printWin.print();
            printWin.close();
        }, 800);
    };

    useEffect(() => {
        if (isOpen) {
            document.body.classList.add('printing-badge');
        } else {
            document.body.classList.remove('printing-badge');
        }
        return () => {
            document.body.classList.remove('printing-badge');
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleColorChange = (e) => {
        const { name, value } = e.target;
        setColors(prev => ({ ...prev, [name]: value }));
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => setCustomLogo(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    return createPortal(
        <div className="badge-print-overlay">
            <div className="modal-container badge-modal">
                <div className="modal-header no-print">
                    <h2>Personnalisation et Impression du Badge</h2>
                    <button type="button" className="close-btn" onClick={onClose}>
                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="modal-body badge-modal-body">
                    <div className="badge-controls no-print">
                        <h3>Personnalisation du Badge</h3>
                        <div className="customization-section">
                            <div className="color-pickers">
                                <div className="color-picker-group">
                                    <label>Couleur 1 (Foncé)</label>
                                    <input type="color" name="primary" value={colors.primary} onChange={handleColorChange} />
                                </div>
                                <div className="color-picker-group">
                                    <label>Couleur 2 (Moyen)</label>
                                    <input type="color" name="secondary" value={colors.secondary} onChange={handleColorChange} />
                                </div>
                                <div className="color-picker-group">
                                    <label>Couleur 3 (Clair)</label>
                                    <input type="color" name="tertiary" value={colors.tertiary} onChange={handleColorChange} />
                                </div>
                            </div>
                            <div className="logo-upload-group">
                                <label>Changer le Logo</label>
                                <input type="file" accept="image/*" onChange={handleLogoUpload} className="logo-file-input" />
                            </div>
                        </div>
                        <p className="controls-hint">Modifiez ces couleurs et le logo pour adapter le design du badge.</p>
                    </div>

                    <div className="badge-preview-area" ref={printRef} style={{
                        '--badge-primary': colors.primary,
                        '--badge-secondary': colors.secondary,
                        '--badge-tertiary': colors.tertiary
                    }}>
                        <div className="badge-card printable-badge">
                            <div className="badge-decoration badge-top">
                                <svg viewBox="0 0 320 100" preserveAspectRatio="none" className="wave-svg">
                                    <path d="M0,0 L320,0 L320,80 Q160,30 0,20 Z" fill={colors.tertiary} />
                                    <path d="M0,0 L320,0 L320,60 Q160,20 0,10 Z" fill={colors.secondary} />
                                    <path d="M100,0 L320,0 L320,40 Q250,15 200,0 Z" fill={colors.primary} />
                                </svg>
                            </div>

                            <div className="badge-content">
                                <div className="badge-logo-area">
                                    <img src={customLogo} alt="Logo" className="softsys-logo-img" />
                                </div>

                                <div className="badge-photo-container" style={{borderColor: colors.primary}}>
                                    {employee.photo ? (
                                        <img src={employee.photo} alt="Employé" className="badge-photo" />
                                    ) : (
                                        <div className="badge-photo-placeholder">
                                            {(employee.nom || '')[0]}{(employee.prenom || '')[0]}
                                        </div>
                                    )}
                                </div>

                                <div className="badge-card-info">
                                    <h2 className="badge-name">{employee.nom} {employee.prenom}</h2>
                                    <p className="badge-role" style={{color: colors.primary}}>{employee.fonction}</p>
                                    <div className="badge-divider" style={{background: colors.tertiary}}></div>
                                    <p className="badge-matricule" style={{color: colors.primary}}>{employee.matricule}</p>
                                    <p className="badge-company" style={{color: colors.primary}}>{employee.service}</p>
                                </div>

                                <div className="badge-codes">
                                    <div className="barcode-placeholder">
                                        <RealBarcode value={employee.matricule || employee.codeBarre || "000000"} />
                                    </div>
                                    <div className="qrcode-placeholder">
                                        <RealQRCode value={employee.codeBarre || employee.matricule || "000000"} />
                                    </div>
                                </div>
                            </div>

                            <div className="badge-decoration badge-bottom">
                                <svg viewBox="0 0 320 100" preserveAspectRatio="none" className="wave-svg bottom-wave">
                                    <path d="M0,0 L320,0 L320,80 Q160,30 0,20 Z" fill={colors.tertiary} />
                                    <path d="M0,0 L320,0 L320,60 Q160,20 0,10 Z" fill={colors.secondary} />
                                    <path d="M100,0 L320,0 L320,40 Q250,15 200,0 Z" fill={colors.primary} />
                                </svg>
                            </div>
                        </div>

                        <div className="badge-card printable-badge badge-back">
                            <div className="badge-decoration badge-top">
                                <svg viewBox="0 0 320 100" preserveAspectRatio="none" className="wave-svg">
                                    <path d="M0,0 L320,0 L320,80 Q160,30 0,20 Z" fill={colors.tertiary} />
                                    <path d="M0,0 L320,0 L320,60 Q160,20 0,10 Z" fill={colors.secondary} />
                                    <path d="M100,0 L320,0 L320,40 Q250,15 200,0 Z" fill={colors.primary} />
                                </svg>
                            </div>

                            <div className="badge-content back-content">
                                <div className="badge-logo-area small">
                                    <img src={customLogo} alt="Logo" className="softsys-logo-img" />
                                </div>

                                <h3 className="terms-title" style={{color: colors.primary}}>TERMS & CONDITIONS</h3>

                                <ul className="terms-list">
                                    <li>Le porteur de ce badge est tenu au respect strict de la confidentialité des informations, conformément aux politiques internes et à la réglementation en vigueur.</li>
                                    <li>Carte professionnelle - Usage interne uniquement .<br/>En cas de perte, merci de contacter l'administration de softsys</li>
                                </ul>

                                <div className="signature-area">
                                    <div className="signature-placeholder">
                                        <svg viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M 20 60 Q 40 10, 80 20 T 140 30 Q 150 70, 160 50 Q 180 30, 170 10 Q 140 10, 120 40 Q 100 80, 120 70 Q 140 60, 180 60" fill="transparent" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M 130 30 Q 140 10, 150 40 Q 160 70, 170 20" fill="transparent" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="badge-decoration badge-bottom">
                                <svg viewBox="0 0 320 100" preserveAspectRatio="none" className="wave-svg bottom-wave">
                                    <path d="M0,0 L320,0 L320,80 Q160,30 0,20 Z" fill={colors.tertiary} />
                                    <path d="M0,0 L320,0 L320,60 Q160,20 0,10 Z" fill={colors.secondary} />
                                    <path d="M100,0 L320,0 L320,40 Q250,15 200,0 Z" fill={colors.primary} />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="modal-footer no-print">
                    <Button type="button" variant="secondary" onClick={onClose}>Fermer</Button>
                    <Button
                        type="button"
                        variant="primary"
                        onClick={handlePrint}
                        icon={
                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zM9 9V5a2 2 0 012-2h2a2 2 0 012 2v4M7 13h10" />
                            </svg>
                        }
                    >
                        Imprimer le Badge
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default BadgeModal;