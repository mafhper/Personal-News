
import React from 'react';
import { useFocusManagement } from '../hooks/useFocusManagement';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    initialFocus?: string;
    ariaLabelledBy?: string;
    ariaLabel?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, initialFocus, ariaLabelledBy, ariaLabel }) => {
    const { containerRef, restoreFocus } = useFocusManagement(isOpen, {
        trapFocus: true,
        restoreFocus: true,
        initialFocus: initialFocus || 'button',
        onEscape: onClose
    });

    // Handle modal close with focus restoration
    const handleClose = () => {
        restoreFocus();
        onClose();
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 transition-opacity"
            onClick={handleClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby={ariaLabelledBy}
            aria-label={ariaLabel}
        >
            <div
                ref={containerRef}
                className="bg-[#1e1e1e] rounded-lg shadow-xl p-4 sm:p-6 lg:p-8 m-4 max-w-sm sm:max-w-2xl lg:max-w-6xl xl:max-w-7xl w-full max-h-[90vh] overflow-y-auto transform transition-all relative"
                onClick={(e) => e.stopPropagation()}
                role="document"
            >
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                    aria-label="Close modal"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                {children}
            </div>
        </div>
    );
};
