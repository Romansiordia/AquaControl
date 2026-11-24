import React from 'react';

interface ShrimpIconProps {
  className?: string;
  strokeWidth?: number;
}

export const ShrimpIcon: React.FC<ShrimpIconProps> = ({
  className = 'w-5 h-5',
  strokeWidth = 5,
}) => (
  <svg
    className={className}
    viewBox="0 0 100 100"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {/* Antennae */}
    <path d="M 65 42 C 85 35 85 15 70 15 C 50 15 25 25 25 25" />
    <path d="M 75 45 C 95 45 95 5 70 5 C 40 5 15 15 15 15" />

    {/* Head */}
    <path d="M 65 42 L 75 45 C 75 45 70 55 55 55 L 50 40" />
    <circle cx="62" cy="47" r="3" fill="currentColor" stroke="none" />

    {/* Body Back Curve */}
    <path d="M 50 40 C 30 30 5 45 10 70 C 15 90 35 95 50 85 C 55 80 60 75 60 75" />

    {/* Inner Belly Curve */}
    <path d="M 55 55 C 35 55 25 65 25 75 C 25 85 40 90 50 85" />

    {/* Segments (Shell lines) */}
    <path d="M 18 50 C 25 55 30 55 35 53" />
    <path d="M 13 65 C 20 65 25 66 28 64" />
    <path d="M 20 82 C 25 80 30 78 32 75" />

    {/* Legs */}
    <path d="M 35 61 C 38 65 42 70 42 75" />
    <path d="M 42 58 C 45 62 50 67 50 72" />
    <path d="M 50 55 C 53 60 58 64 58 68" />

    {/* Tail fins */}
    <path d="M 60 75 C 70 75 75 85 70 90 C 65 90 60 85 60 75" />
    <path d="M 60 75 C 70 70 80 75 75 80 C 70 85 65 80 60 75" />
  </svg>
);

export default ShrimpIcon;
