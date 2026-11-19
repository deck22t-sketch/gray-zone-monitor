import type { Metadata } from 'next';
import { ContagionView } from '@/components/views/ContagionView';

export const metadata: Metadata = {
  title: 'Contagion & Legal',
  description:
    'Private executive risk synthesis & public infrastructure telemetry briefing. Shared access passphrase required.',
};

export default function ContagionPage() {
  return <ContagionView />;
}
