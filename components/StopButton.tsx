import React from 'react';
import StopIcon from './icons/StopIcon';

interface StopButtonProps {
  onClick: () => void;
  'aria-label': string;
}

const StopButton: React.FC<StopButtonProps> = ({ onClick, ...props }) => {
  return (
    <div className="relative flex items-center justify-center">
      <button
        onClick={onClick}
        {...props}
        className="relative w-24 h-24 rounded-full flex items-center justify-center text-white transition-all duration-200 ease-in-out shadow-lg bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-500/50"
      >
        <StopIcon className="w-9 h-9" />
      </button>
    </div>
  );
};

export default StopButton;