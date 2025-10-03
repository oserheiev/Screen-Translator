import React from 'react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  return (
    <div className="error-message">
      <p>{message}</p>
      {onRetry && (
        <button 
          className="retry-button" 
          onClick={onRetry}
        >
          Retry
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;