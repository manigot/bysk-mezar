import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Supabase Board',
  description: 'Drag & drop board items stored in Supabase',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-900 text-slate-50">
        <div className="min-h-screen">{children}</div>
      </body>
    </html>
  );
}
