// ABOUTME: Root layout for Next.js application with metadata and global styles
// ABOUTME: Provides consistent styling and document structure

import type { Metadata } from "next";
import { Providers } from './providers';
import "./globals.css";

export const metadata: Metadata = {
  title: 'Revise - Outil d\'aide à l\'écriture',
  description: 'Outil minimaliste pour réécrire vos textes avec l\'aide de l\'IA',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
