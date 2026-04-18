
import React from 'react';
import './Modal.css';
import { FaExclamationCircle, FaCheckCircle, FaInfoCircle } from 'react-icons/fa';

const Modal = ({ isOpen, onClose, title, message, type = 'info' }) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success': return <FaCheckCircle className="modal-icon success" />;
      case 'error': return <FaExclamationCircle className="modal-icon error" />;
      default: return <FaInfoCircle className="modal-icon info" />;
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-in">
        <div className="modal-header">
          {getIcon()}
          <h3>{title}</h3>
        </div>
        <div className="modal-body">
          <p>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="modal-close-btn" onClick={onClose}>Tamam</button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
