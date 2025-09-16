// src/components/Modal.jsx
import React from 'react';
import { X } from 'lucide-react';

function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) {
    return null; // Don't render anything if the modal is closed
  }

  return (
    // Main container for the overlay
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      {/* The modal content window */}
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg relative">
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>
        {/* Modal Body */}
        <div>
          {children}
        </div>
      </div>
    </div>
  );
}

export default Modal;