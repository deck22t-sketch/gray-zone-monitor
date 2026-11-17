import type { Metadata } from 'next';
import './globals.css';
import { PortalProvider } from '@/context/PortalContext';
import { VaultGate } from '@/components/shell/VaultGate';
import { TopNav } from '@/components/shell/TopNav';
import { SourceDrawer } from '@/components/shell/SourceDrawer';
import { ChangelogDrawer } from '@/components/shell/ChangelogDrawer';
import { CommandSearchModal } from '@/components/shell/CommandSearchModal';

export const metadata: Metadata = {
  title: {
    default: 'Gray-Zone & Critical Infrastructure Risk Monitor | Executive Briefing Portal',
    template: '%s | Gray-Zone Risk Monitor',
  },
  description:
    'Live geopolitical strategy, gray-zone warfare, 10-event critical infrastructure outage forensics, financial contagion, and zero-key federal/backbone OSINT monitor.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      style={
        {
          '--font-inter': "'Inter'",
          '--font-jetbrains-mono': "'JetBrains Mono'",
        } as React.CSSProperties
      }
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#0A0E17] text-gray-200 antialiased selection:bg-[#38BDF8]/25 selection:text-white">
        <PortalProvider>
          <VaultGate>
            <div className="min-h-screen flex flex-col">
              <TopNav />
              <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-7">
                {children}
              </main>
              <footer className="border-t border-white/10 bg-[#0A0E17] py-6 mt-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono-tactical text-gray-500">
                  <div>
                    GRAY-ZONE &amp; CRITICAL INFRASTRUCTURE RISK MONITOR · CANONICAL BRIEFING EDITION: NOV 17, 2026
                  </div>
                  <div>
                    INGESTION: ZERO-KEY PUBLIC FEDERAL &amp; BACKBONE FEEDS · SOURCE ATTRIBUTION VERIFIED
                  </div>
                </div>
              </footer>
            </div>
            <SourceDrawer />
            <ChangelogDrawer />
            <CommandSearchModal />
          </VaultGate>
        </PortalProvider>
      </body>
    </html>
  );
}
