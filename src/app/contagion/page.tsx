import type { Metadata } from 'next';
import { ContagionView } from '@/components/views/ContagionView';

export const metadata: Metadata = {
  title: 'Financial Contagion, Attribution & Legal Matrix',
  description:
    'JPMorgan Chase / Zelle G-SIB counterparty cascades, $10M RTP/FedNow autonomous AI bank runs, Dec. 31 DTCC Treasury clearing, 4-step NSC attribution ladder, LMA war exclusions, and Judge Rakoff AI privilege rule.',
};

export default function ContagionPage() {
  return <ContagionView />;
}
