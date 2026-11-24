import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, HelpCircle, Info, XCircle } from 'lucide-react';
import { Modal, Button } from './Modal';
import { tk } from './i18n';
import { brancherDialogues } from './dialogueApi';

const ICONES = { success: CheckCircle2, error: XCircle, warning: AlertTriangle, question: HelpCircle, info: Info };
const TONS = { success: 'success', error: 'danger', warning: 'warning', question: 'default', info: 'default' };

const nettoyerTitre = (s) => String(s ?? '').replace(/^[\p{Extended_Pictographic}️‍\s]+/u, '').trim();

function DialogueTemplate({ d, onFin }) {
  const type = ICONES[d.icon] ? d.icon : (d.showCancelButton ? 'question' : 'info');
  const Icone = ICONES[type];
  const avecInput = Boolean(d.input);
  const [valeur, setValeur] = useState(d.inputValue != null ? String(d.inputValue) : '');
  const [erreur, setErreur] = useState(null);
  const finie = useRef(false);

  const terminer = (r) => {
    if (finie.current) return;
    finie.current = true;
    onFin(r);
  };
  const annuler = (raison = 'cancel') => terminer({ isConfirmed: false, isDenied: false, isDismissed: true, dismiss: raison, value: undefined });
  const confirmer = async () => {
    if (avecInput && d.inputValidator) {
      const msg = await d.inputValidator(valeur);
      if (msg) { setErreur(msg); return; }
    }
    terminer({ isConfirmed: true, isDenied: false, isDismissed: false, value: avecInput ? valeur : true });
  };

  const annulerRef = useRef(null);
  useEffect(() => { annulerRef.current = annuler; });

  useEffect(() => {
    if (!d.timer) return undefined;
    const id = setTimeout(() => annulerRef.current('timer'), d.timer);
    return () => clearTimeout(id);
  }, [d.timer]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && d.allowEscapeKey !== false) annulerRef.current('esc'); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [d.allowEscapeKey]);

  const boutons = d.showConfirmButton !== false || d.showCancelButton;
  const confirmTone = type === 'success' ? 'success' : (type === 'error' || (type === 'warning' && d.showCancelButton)) ? 'danger' : 'primary';

  return (
    <Modal
      size="sm"
      tone={TONS[type]}
      icon={<Icone size={22} />}
      title={nettoyerTitre(d.title) || tk('confirmation', 'Confirmation')}
      onClose={() => annuler('close')}
      closeOnOverlay={d.allowOutsideClick !== false}
      zIndex={10050}
      className="kit-dialogue"
      footer={boutons ? (
        <>
          {d.showCancelButton && (
            <Button variant="secondary" onClick={() => annuler('cancel')}>{d.cancelButtonText || tk('cancel', 'Annuler')}</Button>
          )}
          {d.showConfirmButton !== false && (
            <Button variant={confirmTone} onClick={confirmer} autoFocus={!avecInput}>
              {d.confirmButtonText || (d.showCancelButton ? tk('confirm', 'Confirmer') : 'OK')}
            </Button>
          )}
        </>
      ) : null}
    >
      <div className="kit-dialogue__body" data-modal="true">
        {d.html
          ? <div className="kit-dialogue__text" dangerouslySetInnerHTML={{ __html: d.html }} />
          : d.text || d.message ? <p className="kit-dialogue__text">{d.text || d.message}</p> : null}
        {avecInput && (
          <form onSubmit={(e) => { e.preventDefault(); confirmer(); }}>
            <input
              className="kit-dialogue__input"
              type={d.input === 'number' ? 'number' : 'text'}
              value={valeur}
              onChange={(e) => { setValeur(e.target.value); setErreur(null); }}
              placeholder={d.inputPlaceholder}
              autoFocus
              {...(d.inputAttributes || {})}
            />
            {erreur && <small className="kit-field-error">{erreur}</small>}
          </form>
        )}
        {d.timer && !boutons && <span className="kit-dialogue__timer" style={{ animationDuration: `${d.timer}ms` }} />}
      </div>
    </Modal>
  );
}

export function DialogueHost() {
  const [pile, setPile] = useState([]);

  useEffect(() => brancherDialogues((d) => setPile((p) => [...p, d])), []);

  const courant = pile[0];
  if (!courant) return null;
  return (
    <DialogueTemplate
      key={courant.id}
      d={courant}
      onFin={(r) => {
        courant.resolve(r);
        setPile((p) => p.slice(1));
      }}
    />
  );
}

