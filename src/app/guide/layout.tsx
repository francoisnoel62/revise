// ABOUTME: Layout partagé de la section Guide — chrome commun (navigation, pied de page) à toutes les pages d'aide.
// ABOUTME: Évite de dupliquer la barre de navigation et les liens légaux sur chaque page du guide.

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold">Revise</span>
            </Link>
            <div className="flex items-center gap-2">
              <Link href="/guide">
                <Button variant="ghost" size="sm">
                  Guide
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm">Commencer</Button>
              </Link>
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Accueil
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {children}

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">Revise Studio</span>
              <span className="text-muted-foreground">
                &mdash; La plateforme d&apos;écriture pour auteurs de fiction
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/auth/signin" className="hover:text-foreground transition-colors">
                Connexion
              </Link>
              <Link href="/auth/signup" className="hover:text-foreground transition-colors">
                Inscription
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
              <Link href="/guide" className="hover:text-foreground transition-colors">
                Guide
              </Link>
              <Link href="/blog" className="hover:text-foreground transition-colors">
                Blog
              </Link>
              <Link href="/conditions-generales-utilisation" className="hover:text-foreground transition-colors">
                CGU
              </Link>
              <Link href="/conditions-generales-vente" className="hover:text-foreground transition-colors">
                CGV
              </Link>
              <Link href="/mentions-legales" className="hover:text-foreground transition-colors">
                Mentions légales
              </Link>
              <Link href="/politique-confidentialite" className="hover:text-foreground transition-colors">
                Confidentialité
              </Link>
              <Link href="/politique-cookies" className="hover:text-foreground transition-colors">
                Cookies
              </Link>
            </div>
            <p>&copy; {new Date().getFullYear()} Revise Studio. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
