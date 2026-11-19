import type { Metadata } from 'next';
import { OverviewView } from '@/components/views/OverviewView';

export const metadata: Metadata = {
  title: 'Command Overview',
  description:
    'Private executive risk synthesis & public infrastructure telemetry briefing. Shared access passphrase required.',
};

export default function HomePage() {
  return <OverviewView />;
}
