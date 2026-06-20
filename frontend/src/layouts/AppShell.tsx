// Shell aplikasi: header sticky + 5 top tabs + slot konten (PRD §3).
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '@/components/Icon';
import { StatusBadge } from '@/components/StatusBadge';
import { useSurveyStore } from '@/store/useSurveyStore';
import { ui } from '@/i18n/id';

/** Ekstrak surveyId aktif dari URL (hanya pada rute survey-scoped). */
function surveyIdFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/surveys\/([^/]+)\//);
  return m ? m[1] : null;
}

interface TabDef {
  key: string;
  label: string;
  href: string | null; // null = butuh survei tapi belum ada
  active: boolean;
}

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const surveyId = surveyIdFromPath(path);
  const survey = useSurveyStore((s) =>
    surveyId ? s.surveys.find((sv) => sv.id === surveyId) : undefined,
  );

  const scoped = (suffix: string) => (surveyId ? `/surveys/${surveyId}/${suffix}` : null);

  const tabs: TabDef[] = [
    { key: 'surveys', label: ui.tabs.surveys, href: '/surveys', active: path === '/surveys' },
    {
      key: 'questions',
      label: ui.tabs.questions,
      href: scoped('questions'),
      active: path.endsWith('/questions'),
    },
    {
      key: 'scales',
      label: ui.tabs.scales,
      href: scoped('scales'),
      active: path.endsWith('/scales'),
    },
    {
      key: 'masterData',
      label: ui.tabs.masterData,
      href: '/master-data',
      active: path.startsWith('/master-data'),
    },
    {
      key: 'results',
      label: ui.tabs.results,
      href: scoped('results'),
      active: path.endsWith('/results'),
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

          {survey && (
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary-tint px-2.5 py-1 font-mono text-body-sm text-primary">
                {survey.kode}
              </span>
              <StatusBadge status={survey.status} />
            </div>
          )}

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

        {/* Top tabs */}
        <nav className="flex items-center gap-1 px-6" role="tablist">
          {tabs.map((tab) => {
            const base =
              'relative h-12 px-4 text-body-md font-medium transition-colors border-b-2';
            if (!tab.href) {
              return (
                <span
                  key={tab.key}
                  title="Pilih survei terlebih dahulu"
                  className={`${base} cursor-not-allowed border-transparent text-text-secondary/50`}
                >
                  {tab.label}
                </span>
              );
            }
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
