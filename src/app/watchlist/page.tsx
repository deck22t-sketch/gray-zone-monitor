import type { Metadata } from 'next';
import { WatchlistView } from '@/components/views/WatchlistView';

export const metadata: Metadata = {
  title: '9-Point Watchlist, Live Wire OSINT & Primary Source Vault',
  description:
    '9-Point CISA/FS-ISAC cross-sector forensic watchlist, Live Wire keyless federal/backbone OSINT telemetry, and searchable Primary Source Vault.',
};

export default function WatchlistPage() {
  return <WatchlistView />;
}
