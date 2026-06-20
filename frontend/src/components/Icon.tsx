// Material Symbols Outlined (PRD §2 / §4). Pakai ligature: <Icon name="add" />.
interface IconProps {
  name: string;
  className?: string;
  /** ukuran font-size dalam px (opsz mengikuti) */
  size?: number;
  fill?: boolean;
}

export function Icon({ name, className = '', size = 20, fill = false }: IconProps) {
  return (
    <span
      className={`material-symbols-outlined select-none ${className}`}
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' ${size}`,
      }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}
