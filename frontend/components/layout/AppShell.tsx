'use client';

import { usePortfolio } from '@/lib/PortfolioContext';
import Header from './Header';
import Nav    from './Nav';
import { ErrorMessage } from '@/components/ui/Feedback';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { data, loading, error, lastUpdated, refresh } = usePortfolio();

  return (
    <div className="relative z-[1] flex flex-col min-h-dvh">
      <Header
        usdngn      = {data?.meta.usdngn}
        fxSource    = {data?.meta.fx_source}
        lastUpdated = {lastUpdated ?? undefined}
        loading     = {loading}
        onRefresh   = {refresh}
      />
      <Nav />

      <main className="flex-1 px-4 md:px-8 py-6 max-w-[1600px] w-full mx-auto pb-20 md:pb-6">
        {error && <ErrorMessage message={error} />}
        <div className="page-enter">
          {children}
        </div>
      </main>
    </div>
  );
}