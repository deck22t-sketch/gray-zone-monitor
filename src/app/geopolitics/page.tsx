import type { Metadata } from 'next';
import { GeopoliticsView } from '@/components/views/GeopoliticsView';

export const metadata: Metadata = {
  title: 'Geopolitical Arc',
  description:
    'Private executive risk synthesis & public infrastructure telemetry briefing. Shared access passphrase required.',
};

export default function GeopoliticsPage() {
  return <GeopoliticsView />;
}
