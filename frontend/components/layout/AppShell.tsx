'use client';

import { usePortfolio } from '@/lib/PortfolioContext';
import Header from './Header';
import Nav    from './Nav';
import { ErrorMessage } from '@/components/ui/Feedback';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { data, loading, error, lastUpdated, refresh } = usePortfolio();

  return (
    <ProtectedRoute>
    <div className="flex flex-col min-h-dvh bg-[var(--canvas)]">
      {/* Header contains both the top bar AND the desktop nav */}
      <Header
        usdngn      = {data?.meta.usdngn}
        fxSource    = {data?.meta.fx_source}
        lastUpdated = {lastUpdated ?? undefined}
        loading     = {loading}
        onRefresh   = {refresh}
      />

      {/* Mobile-only bottom nav */}
      <Nav />

      <main className="
        flex-1 w-full mx-auto
        max-w-[var(--content-max)]
        px-[var(--page-px)] md:px-[var(--page-px-md)] lg:px-[var(--page-px-lg)]
        py-6
        pb-[calc(var(--mobile-nav)+24px)] sm:pb-8
      ">
        {error && (
          <div className="mb-5">
            <ErrorMessage message={error} />
          </div>
        )}
        <div className="page-enter">
          {children}
        </div>
      </main>
    </div>
    </ProtectedRoute>
  );
}