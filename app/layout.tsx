import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Add Community Posts',
  description: 'A simple community posts page',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
