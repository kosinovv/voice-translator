
import React from 'react';

const SwapIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path
      fillRule="evenodd"
      d="M15.97 3.97a.75.75 0 011.06 0l3.5 3.5a.75.75 0 010 1.06l-3.5 3.5a.75.75 0 11-1.06-1.06l2.22-2.22H3.75a.75.75 0 010-1.5h14.44L15.97 5.03a.75.75 0 010-1.06zm-7.94 9a.75.75 0 010 1.06l-2.22 2.22H20.25a.75.75 0 010 1.5H5.81l2.22 2.22a.75.75 0 11-1.06 1.06l-3.5-3.5a.75.75 0 010-1.06l3.5-3.5a.75.75 0 011.06 0z"
      clipRule="evenodd"
    />
  </svg>
);

export default SwapIcon;
