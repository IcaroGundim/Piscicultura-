import type { Metadata } from 'next';
import './globals.css';
import TopNav from '@/components/TopNav';
import { ReactGrabPlugin } from '@/components/ReactGrabPlugin';
import { PhaseColorSync } from '@/components/PhaseColorSync';
import { StoreProvider } from '@/lib/store';
import { getProjectState } from '@/lib/projectState.server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Manati',
  description: 'Sistema de gestão de tanques de tambaqui',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const initialState = await getProjectState();

  return (
    <html lang="pt-BR" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full font-sans text-foreground">
        <StoreProvider initialState={initialState}>
          <ReactGrabPlugin />
          <PhaseColorSync />
          <div className="flex flex-col min-h-screen">
            <TopNav />
            <main className="flex-1 min-w-0 bg-background">{children}</main>
          </div>
        </StoreProvider>
      </body>
    </html>
  );
}
