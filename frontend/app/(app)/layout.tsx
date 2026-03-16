import { PortfolioProvider } from '@/context/PortfolioContext';
import AppShell from '@/components/layout/AppShell';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortfolioProvider>
      <AppShell>{children}</AppShell>
    </PortfolioProvider>
  );
}
