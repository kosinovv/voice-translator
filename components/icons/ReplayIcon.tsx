import React from 'react';

const ReplayIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8C6.82 8 3.11 11.33 2.16 15.5H4.22C5.12 12.42 8.03 10 11.5 10C13.5 10 15.27 10.66 16.63 11.73L13 15H21V7L18.4 10.6Z" />
  </svg>
);

export default ReplayIcon;
