import type { Metadata } from 'next';
import './globals.css';
import { PortfolioProvider } from '@/lib/PortfolioContext';
import AppShell from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title:       'Portfolio Analyzer',
  description: 'NGX + US equity portfolio dashboard with live prices',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PortfolioProvider>
          <AppShell>{children}</AppShell>
        </PortfolioProvider>
      </body>
    </html>
  );
}