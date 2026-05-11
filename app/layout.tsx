import type { Metadata } from 'next';
import './globals.css';
import TopNav from '@/components/TopNav';
import { ReactGrabPlugin } from '@/components/ReactGrabPlugin';

export const metadata: Metadata = {
  title: 'AquaGest — Piscicultura',
  description: 'Sistema de gestão de tanques de tambaqui',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full font-sans text-foreground">
        <ReactGrabPlugin />
        <div className="flex flex-col min-h-screen">
          <TopNav />
          <main className="flex-1 min-w-0 bg-background">{children}</main>
        </div>
      </body>
    </html>
  );
}
