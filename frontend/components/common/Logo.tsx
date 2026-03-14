interface LogoProps {
  size?: number;
  className?: string;
}

export const Logo = ({ size = 32, className = '' }: LogoProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background */}
      <rect width="40" height="40" rx="10" fill="#0f172a" className="dark:fill-white" />

      {/* Stylized j — stem with curved hook */}
      <path
        d="M22 12V27C22 30.3137 19.3137 33 16 33H14"
        stroke="white"
        strokeWidth="4.5"
        strokeLinecap="round"
        className="dark:stroke-slate-900"
      />

      {/* Dot of j — indigo accent */}
      <circle cx="22" cy="7.5" r="3" fill="#6366f1" />

      {/* Accent arc — subtle upward energy */}
      <path
        d="M28 18C30.5 15.5 32 12 32 8"
        stroke="#6366f1"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
};

export const LogoSmall = ({ size = 24, className = '' }: LogoProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="40" height="40" rx="10" fill="#0f172a" className="dark:fill-white" />
      <path
        d="M22 12V27C22 30.3137 19.3137 33 16 33H14"
        stroke="white"
        strokeWidth="4.5"
        strokeLinecap="round"
        className="dark:stroke-slate-900"
      />
      <circle cx="22" cy="7.5" r="3" fill="#6366f1" />
      <path
        d="M28 18C30.5 15.5 32 12 32 8"
        stroke="#6366f1"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
};

// White version for dark backgrounds (auth pages left panel)
export const LogoWhite = ({ size = 36, className = '' }: LogoProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="40" height="40" rx="10" fill="white" />
      <path
        d="M22 12V27C22 30.3137 19.3137 33 16 33H14"
        stroke="#0f172a"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <circle cx="22" cy="7.5" r="3" fill="#6366f1" />
      <path
        d="M28 18C30.5 15.5 32 12 32 8"
        stroke="#6366f1"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
};

export default Logo;
