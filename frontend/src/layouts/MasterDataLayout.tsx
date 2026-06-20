// Layout Master data (PRD §8.6): header + sub-tabs (Skala jawaban / Lookup) + Outlet.
// Skala = data referensi global; question menyimpan snapshot-nya (lihat docs/DATABASE.md).
import { Outlet } from 'react-router-dom';
import { SubTabs, type SubTabItem } from '@/components/SubTabs';
import { ui } from '@/i18n/id';

const SUB_TABS: SubTabItem[] = [
  { label: ui.masterTabs.scales, to: 'scales' },
  { label: ui.masterTabs.lookup, to: 'lookup' },
];

export function MasterDataLayout() {
  return (
    <div className="mx-auto max-w-7xl">
      <div>
        <h1 className="text-headline-md">{ui.tabs.masterData}</h1>
        <p className="mt-1 text-body-md text-text-secondary">
          Data referensi terpusat yang dipakai lintas survei.
        </p>
      </div>

      <div className="mt-5">
        <SubTabs items={SUB_TABS} />
      </div>

      <div className="mt-6">
        <Outlet />
      </div>
    </div>
  );
}
