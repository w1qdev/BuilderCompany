interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export default function Logo({ className = "", size = "md", showText = true }: LogoProps) {
  const sizes = {
    sm: { icon: 28, text: "text-sm" },
    md: { icon: 36, text: "text-lg" },
    lg: { icon: 48, text: "text-2xl" },
  };

  const s = sizes[size];

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Outer ring — gauge/dial */}
        <circle cx="24" cy="24" r="22" stroke="url(#logo-grad)" strokeWidth="3" fill="none" />

        {/* Scale marks */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => {
          const major = angle % 90 === 0;
          const rad = (angle * Math.PI) / 180;
          const outerR = 19;
          const innerR = major ? 15 : 16.5;
          return (
            <line
              key={angle}
              x1={24 + innerR * Math.cos(rad)}
              y1={24 + innerR * Math.sin(rad)}
              x2={24 + outerR * Math.cos(rad)}
              y2={24 + outerR * Math.sin(rad)}
              stroke="url(#logo-grad)"
              strokeWidth={major ? 2 : 1.2}
              strokeLinecap="round"
            />
          );
        })}

        {/* Needle pointing ~45° (upper-right — precision) */}
        <line
          x1="24"
          y1="24"
          x2="33"
          y2="15"
          stroke="url(#logo-grad)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Center dot */}
        <circle cx="24" cy="24" r="2.5" fill="url(#logo-grad)" />

        {/* Checkmark — standardization/certification */}
        <path
          d="M15 25l4 4 8-8"
          stroke="url(#logo-grad)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.5"
        />

        <defs>
          <linearGradient id="logo-grad" x1="0" y1="0" x2="48" y2="48">
            <stop offset="0%" stopColor="#E87A2E" />
            <stop offset="100%" stopColor="#F5A623" />
          </linearGradient>
        </defs>
      </svg>
      {showText && (
        <span className={`font-bold ${s.text} leading-tight`}>
          ЦСМ
        </span>
      )}
    </span>
  );
}
