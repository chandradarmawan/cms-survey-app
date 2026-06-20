// Deretan bintang untuk skala kepuasan/persetujuan pada form responden.
// `filled` bintang pertama berwarna aksen (emas), sisanya gelap — meniru tampilan rating.
import { Icon } from './Icon';

export function StarRating({
  filled,
  total,
  size = 18,
}: {
  filled: number;
  total: number;
  size?: number;
}) {
  return (
    <span className="flex items-center gap-0.5" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <Icon
          key={i}
          name="star"
          size={size}
          fill
          className={i < filled ? 'text-accent' : 'text-text-primary/30'}
        />
      ))}
    </span>
  );
}
