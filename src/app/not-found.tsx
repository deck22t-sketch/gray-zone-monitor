import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="glass-panel tac-frame rounded-lg p-10 text-center space-y-4 max-w-xl mx-auto my-12">
      <p className="font-mono-tactical text-xs text-[#F59E0B] uppercase tracking-widest">
        HTTP 404 · ROUTE NOT INDEXED
      </p>
      <h1 className="text-2xl font-semibold text-white">Intelligence Dossier Not Found</h1>
      <p className="text-sm text-gray-400">
        Return to the Command Overview or press <kbd className="font-mono-tactical">⌘K</kbd> to
        search across risk vectors, tracked incidents, watchlist signals, and primary sources.
      </p>
      <div className="pt-2">
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 rounded-md bg-[#38BDF8]/15 hover:bg-[#38BDF8]/25 border border-[#38BDF8]/40 text-xs font-mono-tactical text-[#38BDF8]"
        >
          Return to Command Overview →
        </Link>
      </div>
    </div>
  );
}
