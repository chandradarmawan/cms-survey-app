// Shell aplikasi: header sticky + top tabs global + slot konten (PRD §3).
// Tab survey-scoped (pertanyaan/skala/hasil) kini jadi sub-tab di SurveyDetailLayout.
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '@/components/Icon';
import { ui } from '@/i18n/id';

interface TabDef {
  key: string;
  label: string;
  href: string;
  active: boolean;
}

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const tabs: TabDef[] = [
    {
      key: 'surveys',
      label: ui.tabs.surveys,
      href: '/surveys',
      // Aktif untuk daftar survei maupun saat berada di dalam detail survei.
      active: path === '/surveys' || path.startsWith('/surveys/'),
    },
    {
      key: 'masterData',
      label: ui.tabs.masterData,
      href: '/master-data',
      active: path.startsWith('/master-data'),
    },
  ];

  return (
    <div className="flex min-h-full flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-surface">
        <div className="flex h-16 items-center gap-4 px-8">
          <button
            onClick={() => navigate('/surveys')}
            className="flex items-center gap-2.5 text-text-primary"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded bg-primary text-white">
              <Icon name="assignment" size={22} fill />
            </span>
            <span className="text-headline-sm">{ui.brand}</span>
          </button>

          <div className="ml-auto flex items-center gap-1">
            <button className="flex h-10 w-10 items-center justify-center rounded text-text-secondary hover:bg-primary-tint">
              <Icon name="notifications" />
            </button>
            <button className="flex h-10 w-10 items-center justify-center rounded text-text-secondary hover:bg-primary-tint">
              <Icon name="settings" />
            </button>
            <span className="ml-2 flex h-9 w-9 items-center justify-center rounded-full bg-primary-dark text-body-sm font-medium text-white">
              AD
            </span>
          </div>
        </div>

        {/* Top tabs global */}
        <nav className="flex items-center gap-1 px-6" role="tablist">
          {tabs.map((tab) => {
            const base =
              'relative h-12 px-4 text-body-md font-medium transition-colors border-b-2';
            return (
              <Link
                key={tab.key}
                to={tab.href}
                role="tab"
                aria-selected={tab.active}
                className={`${base} ${
                  tab.active
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Konten */}
      <main className="flex-1 px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
