'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldAlert, Globe, Activity, Scale, Eye } from 'lucide-react';

const MOBILE_NAV_ITEMS = [
  { href: '/', label: 'Overview', icon: ShieldAlert },
  { href: '/geopolitics', label: 'Geopolitics', icon: Globe },
  { href: '/incidents', label: 'Forensics', icon: Activity },
  { href: '/contagion', label: 'Contagion', icon: Scale },
  { href: '/watchlist', label: 'Watchlist', icon: Eye },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();

  const isRouteActive = (href: string) => {
    if (href === '/') {
      return pathname === '/' || pathname === '';
    }
    return pathname === href || pathname === `${href}/` || pathname.startsWith(`${href}/`);
  };

  return (
    <nav
      aria-label="Primary Navigation"
      className="md:hidden print:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0A0E17]/94 backdrop-blur-xl border-t border-white/12 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="grid grid-cols-5 items-stretch px-1 py-1">
        {MOBILE_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isRouteActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl transition ${
                active
                  ? 'text-[#38BDF8] bg-[#38BDF8]/10'
                  : 'text-gray-400 hover:text-gray-200 active:bg-white/[0.05]'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-[#38BDF8]' : 'text-gray-400'}`} />
              <span className="font-mono-tactical text-[10px] font-medium tracking-tight leading-none mt-0.5">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
