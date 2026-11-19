import type { Metadata } from 'next';
import { IncidentsView } from '@/components/views/IncidentsView';

export const metadata: Metadata = {
  title: 'Outage Wave & Forensics',
  description:
    'Private executive risk synthesis & public infrastructure telemetry briefing. Shared access passphrase required.',
};

export default function IncidentsPage() {
  return <IncidentsView />;
}
