// Placeholder untuk tab yang menyusul (PRD §13 roadmap).
import { Icon } from './Icon';

interface StubPageProps {
  title: string;
  milestone: string;
  desc: string;
  icon?: string;
}

export function StubPage({ title, milestone, desc, icon = 'construction' }: StubPageProps) {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-headline-md">{title}</h1>
      <div className="card mt-6 flex flex-col items-center gap-3 p-12 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-tint text-primary">
          <Icon name={icon} size={28} />
        </span>
        <p className="text-body-lg font-medium">Segera hadir</p>
        <p className="max-w-md text-body-md text-text-secondary">{desc}</p>
        <span className="mt-1 rounded-full bg-[#FFF7ED] px-3 py-1 text-body-sm font-medium text-[#C2410C]">
          {milestone}
        </span>
      </div>
    </div>
  );
}
