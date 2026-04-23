'use client';

import Header from './Header';
import Nav from './Nav';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-dvh bg-[var(--canvas)]">
        <Header />
        <Nav />
        <main
          className="
            flex-1 w-full mx-auto
            max-w-[var(--content-max)]
            px-[var(--page-px)] md:px-[var(--page-px-md)] lg:px-[var(--page-px-lg)]
            py-6
            pb-[calc(var(--mobile-nav)+24px)] sm:pb-8
          "
        >
          <div className="page-enter">{children}</div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
