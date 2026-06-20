// Sub-navigasi underline sekunder (PRD §3). Dipakai detail survei & master data.
import { Link, useLocation } from 'react-router-dom';

export interface SubTabItem {
  label: string;
  to: string; // path relatif terhadap rute induk (mis. "questions")
}

export function SubTabs({ items }: { items: SubTabItem[] }) {
  const { pathname } = useLocation();
  return (
    <nav className="flex items-center gap-1 border-b border-border" role="tablist">
      {items.map((t) => {
        const active = pathname.endsWith(`/${t.to}`);
        return (
          <Link
            key={t.to}
            to={t.to}
            role="tab"
            aria-selected={active}
            className={`relative -mb-px h-10 border-b-2 px-3.5 text-body-sm font-medium transition-colors ${
              active
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
