import React from 'react';

interface CaptureButtonProps {
  onCapture: () => void;
  disabled?: boolean;
}

const CaptureButton: React.FC<CaptureButtonProps> = ({ onCapture, disabled = false }) => {
  return (
    <button 
      className="capture-button" 
      onClick={onCapture} 
      disabled={disabled}
    >
      Capture Screen
    </button>
  );
};

export default CaptureButton;