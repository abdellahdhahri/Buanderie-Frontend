import React, { createContext, useState, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaExclamationTriangle, FaInfoCircle, FaCheckCircle, FaQuestionCircle } from 'react-icons/fa';

const ModalContext = createContext();

export const useModal = () => useContext(ModalContext);

export const ModalProvider = ({ children }) => {
  const [modal, setModal] = useState(null);

  const showModal = useCallback(({ title, message, type = 'info', onConfirm, onCancel, confirmText = 'OK', cancelText = 'Annuler' }) => {
    return new Promise((resolve) => {
      setModal({
        title,
        message,
        type,
        confirmText,
        cancelText,
        onConfirm: () => {
          setModal(null);
          if (onConfirm) onConfirm();
          resolve(true);
        },
        onCancel: () => {
          setModal(null);
          if (onCancel) onCancel();
          resolve(false);
        }
      });
    });
  }, []);

  const showAlert = (title, message, type = 'info') => showModal({ title, message, type, cancelText: null });
  const showConfirm = (title, message, type = 'warning') => showModal({ title, message, type, confirmText: 'Confirmer', cancelText: 'Annuler' });

  return (
    <ModalContext.Provider value={{ showModal, showAlert, showConfirm }}>
      {children}
      <AnimatePresence>
        {modal && (
          <div className="custom-modal-overlay">
            <motion.div 
              className="custom-modal-content"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
            >
              <div className={`modal-icon ${modal.type}`}>
                {modal.type === 'warning' && <FaExclamationTriangle />}
                {modal.type === 'info' && <FaInfoCircle />}
                {modal.type === 'success' && <FaCheckCircle />}
                {modal.type === 'question' && <FaQuestionCircle />}
              </div>
              
              <div className="modal-body">
                <h3>{modal.title}</h3>
                <p>{modal.message}</p>
              </div>

              <div className="modal-actions">
                {modal.cancelText && (
                  <button className="modal-btn cancel" onClick={modal.onCancel}>
                    {modal.cancelText}
                  </button>
                )}
                <button className={`modal-btn confirm ${modal.type}`} onClick={modal.onConfirm}>
                  {modal.confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <style>{`
        .custom-modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(26, 75, 71, 0.4);
          backdrop-filter: blur(8px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
        }
        .custom-modal-content {
          background: white;
          padding: 30px;
          border-radius: 24px;
          width: 90%;
          max-width: 400px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          text-align: center;
          border: 1px solid rgba(255, 255, 255, 0.5);
        }
        .modal-icon {
          font-size: 48px;
          margin-bottom: 20px;
        }
        .modal-icon.info { color: #128354; }
        .modal-icon.warning { color: #f59e0b; }
        .modal-icon.success { color: #10b981; }
        .modal-icon.question { color: #8b5cf6; }
        
        .modal-body h3 {
          margin: 0 0 10px 0;
          color: #0f172a;
          font-size: 20px;
          font-weight: 700;
        }
        .modal-body p {
          color: #64748b;
          font-size: 15px;
          line-height: 1.5;
          margin-bottom: 25px;
        }
        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
        }
        .modal-btn {
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }
        .modal-btn.confirm.info { background: #197e60; color: white; }
        .modal-btn.confirm.warning { background: #f59e0b; color: white; }
        .modal-btn.confirm.success { background: #10b981; color: white; }
        .modal-btn.confirm.question { background: #8b5cf6; color: white; }
        
        .modal-btn.cancel {
          background: #f1f5f9;
          color: #64748b;
        }
        .modal-btn:hover {
          transform: translateY(-2px);
          filter: brightness(1.1);
        }
        .modal-btn:active {
          transform: translateY(0);
        }
      `}</style>
    </ModalContext.Provider>
  );
};
