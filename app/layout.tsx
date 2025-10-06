import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Correctify',
  description: 'AI-powered grammar correction',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-background dark:bg-gray-950">
      <body className="bg-background dark:bg-gray-950 text-foreground dark:text-white antialiased">
        {children}
      </body>
    </html>
  );
}
