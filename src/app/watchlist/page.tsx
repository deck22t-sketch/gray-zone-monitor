import type { Metadata } from 'next';
import { WatchlistView } from '@/components/views/WatchlistView';

export const metadata: Metadata = {
  title: 'Watchlist & Live Wire',
  description:
    'Private executive risk synthesis & public infrastructure telemetry briefing. Shared access passphrase required.',
};

export default function WatchlistPage() {
  return <WatchlistView />;
}
