import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/sonner";
import { AppLayout } from '@/components/AppLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Piscineiro App',
  description: 'Gerenciamento para piscineiros',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <body className={inter.className}>
        {/* Não precisamos mais do AuthProvider aqui, o AppLayout e o middleware cuidam de tudo */}
        <AppLayout>{children}</AppLayout>
        <Toaster richColors />
      </body>
    </html>
  );
}