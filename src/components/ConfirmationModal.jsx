// Create a new file: components/ConfirmationModal.jsx
import React from 'react';

const ConfirmationModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title = "Confirm Action", 
    message = "Are you sure you want to proceed?",
    confirmText = "Delete",
    cancelText = "Cancel",
    isLoading = false
}) => {
    if (!isOpen) return null;

    return (
        <div className="confirmation-modal-overlay">
            <div className="confirmation-modal">
                <div className="confirmation-modal-header">
                    <h3>{title}</h3>
                </div>
                
                <div className="confirmation-modal-body">
                    <p>{message}</p>
                </div>
                
                <div className="confirmation-modal-footer">
                    <button 
                        className="confirm-cancel-btn"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        {cancelText}
                    </button>
                    <button 
                        className="confirm-delete-btn"
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Deleting...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;