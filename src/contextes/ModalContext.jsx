import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { DialogueHost } from '../components/kit/Dialogue';
import { ouvrirDialogue } from '../components/kit/dialogueApi';

const ModalContext = createContext();

export const useModal = () => useContext(ModalContext);

export const ModalProvider = ({ children }) => {
  const showModal = useCallback(async ({ title, message, type = 'info', onConfirm, onCancel, confirmText = 'OK', cancelText = 'Annuler' }) => {
    const r = await ouvrirDialogue({
      title,
      text: message,
      icon: type,
      showCancelButton: Boolean(cancelText),
      confirmButtonText: confirmText,
      cancelButtonText: cancelText || undefined,
    });
    if (r.isConfirmed) { if (onConfirm) onConfirm(); return true; }
    if (onCancel) onCancel();
    return false;
  }, []);

  const showAlert = useCallback((title, message, type = 'info') => showModal({ title, message, type, cancelText: null }), [showModal]);
  const showConfirm = useCallback((title, message, type = 'warning') => showModal({ title, message, type, confirmText: 'Confirmer', cancelText: 'Annuler' }), [showModal]);

  const valeur = useMemo(() => ({ showModal, showAlert, showConfirm }), [showModal, showAlert, showConfirm]);

  return (
    <ModalContext.Provider value={valeur}>
      {children}
      <DialogueHost />
    </ModalContext.Provider>
  );
};
