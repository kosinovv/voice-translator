
import React from 'react';
import MicIcon from './icons/MicIcon';
import SpinnerIcon from './icons/SpinnerIcon';

interface RecordButtonProps {
  isRecording: boolean;
  isProcessing: boolean;
  onMouseDown: () => void;
  onMouseUp: () => void;
  onTouchStart: () => void;
  onTouchEnd: () => void;
}

const RecordButton: React.FC<RecordButtonProps> = ({
  isRecording,
  isProcessing,
  ...props
}) => {
  const buttonStateClasses = isProcessing
    ? 'bg-gray-500 cursor-not-allowed'
    : isRecording
    ? 'bg-red-600 scale-110 shadow-red-500/50'
    : 'bg-blue-600 hover:bg-blue-700';

  const ringStateClasses = isRecording ? 'border-red-400' : 'border-transparent';

  return (
    <div className="relative flex items-center justify-center">
      <div
        className={`absolute w-28 h-28 rounded-full border-4 ${ringStateClasses} transition-all duration-300 animate-pulse`}
      />
      <button
        {...props}
        disabled={isProcessing}
        className={`relative w-24 h-24 rounded-full flex items-center justify-center text-white transition-all duration-200 ease-in-out shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-500/50 ${buttonStateClasses}`}
      >
        {isProcessing ? (
          <SpinnerIcon className="w-10 h-10" />
        ) : (
          <MicIcon className="w-10 h-10" />
        )}
      </button>
    </div>
  );
};

export default RecordButton;
