import type { Metadata } from 'next';
import { IncidentsView } from '@/components/views/IncidentsView';

export const metadata: Metadata = {
  title: 'Outage Wave & Forensics Explorer — Nov 12–17 Cluster & Poisson Math',
  description:
    'Forensic explorer for Events #1–#10 (OPTIMJACK malicious supply-chain attack, FAA two-router TDM flood, NSANet, Apple cascade), Poisson base-rate calculator, and Sub-IP blind spots.',
};

export default function IncidentsPage() {
  return <IncidentsView />;
}
