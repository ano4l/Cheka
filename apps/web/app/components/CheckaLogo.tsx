interface CheckaLogoProps {
  className?: string;
}

export function CheckaLogo({ className }: CheckaLogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="1" y="1" width="30" height="30" rx="8" fill="#0f766e" />
      <path
        d="M9 16.5l4.5 4.5L23 11.5"
        stroke="white"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
