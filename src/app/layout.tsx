import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ServerIPScript } from '@/components/ServerIPScript';
import { getLocalNetworkIP, getCommandLineIP } from '@/lib/ipUtils';
import { ThemeProvider } from '@/components/ThemeProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DealMe 2',
  description: 'DealMe 2 - A digital companion for live poker games',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Detect the server's IP address
  const commandLineIP = getCommandLineIP();
  const localNetworkIP = getLocalNetworkIP();
  const serverIP = commandLineIP || localNetworkIP;
  
  return (
    <html lang="en">
      <head>
        <ServerIPScript serverIP={serverIP} />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <main className="min-h-screen p-4 md:p-8">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
