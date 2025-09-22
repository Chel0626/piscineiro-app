import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/sonner";
import { AppLayout } from '@/components/AppLayout';
import { ThemeProvider } from '@/components/ThemeProvider';
import { OfflineIndicator } from '@/components/OfflineIndicator';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Piscineiro App - Gestão Profissional de Piscinas',
  description: 'App completo para gestão profissional de piscinas com clientes, roteiros, calculadora de produtos químicos e controle de pagamentos',
  generator: 'Next.js',
  manifest: '/manifest.json',
  keywords: ['piscineiro', 'piscina', 'gestão', 'clientes', 'produtos químicos', 'manutenção'],
  authors: [
    { name: 'Piscineiro Team' },
  ],
  icons: {
    icon: '/logo-icon.svg',
    shortcut: '/logo-icon.svg',
    apple: '/logo-icon.svg',
  },
  metadataBase: new URL('https://piscineiro-app.vercel.app'),
  openGraph: {
    type: 'website',
    title: 'Piscineiro App - Gestão Profissional de Piscinas',
    description: 'App completo para gestão profissional de piscinas',
    siteName: 'Piscineiro App',
    images: [
      {
        url: '/icon-512x512.png',
        width: 512,
        height: 512,
        alt: 'Piscineiro App',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Piscineiro App',
    description: 'Gestão profissional de piscinas',
    images: ['/icon-512x512.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Piscineiro App',
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'PiscineiroApp',
    'application-name': 'PiscineiroApp',
    'msapplication-TileColor': '#0284c7',
    'msapplication-config': '/browserconfig.xml',
    'theme-color': '#0284c7',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="theme-color" content="#0284c7" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="PiscineiroApp" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="PiscineiroApp" />
        <meta name="msapplication-TileColor" content="#0284c7" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* Não precisamos mais do AuthProvider aqui, o AppLayout e o middleware cuidam de tudo */}
          <AppLayout>{children}</AppLayout>
          <OfflineIndicator />
          <Toaster richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}