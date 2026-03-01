interface QuantingLogoProps {
  size?: number;
  color?: string;
  className?: string;
}

export default function QuantingLogo({
  size = 18,
  color = "currentColor",
  className,
}: QuantingLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M273 92 L420 239 Q437 256 420 273 L273 420 Q256 437 239 420 L92 273 Q75 256 92 239 L239 92 Q256 75 273 92 Z"
        fill={color}
      />
      <circle cx="338" cy="338" r="24" fill={color} />
      <circle cx="430" cy="430" r="24" fill={color} />
      <polygon points="321,355 355,321 447,413 413,447" fill={color} />
    </svg>
  );
}
