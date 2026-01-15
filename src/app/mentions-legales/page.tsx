// ABOUTME: Page des mentions légales obligatoires (LCEN)
// ABOUTME: Contient les informations d'identification de l'éditeur et de l'hébergeur

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Mentions légales - Revise',
  description: 'Mentions légales et informations sur l\'éditeur du site Revise',
};

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold">Revise</span>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour à l&apos;accueil
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="container mx-auto px-4 py-12 md:py-20">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">Mentions légales</h1>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
            <p className="text-muted-foreground">
              Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">1. Éditeur du site</h2>
              <p>
                Le site <strong>Revise</strong> (accessible à l&apos;adresse{' '}
                <a href="https://revise.studio" className="text-primary hover:underline">https://revise.studio</a>) est édité par :
              </p>
              <ul className="list-none space-y-2 pl-0">
                <li><strong>Nom :</strong> François Fanfan</li>
                <li><strong>Statut :</strong> Personne physique</li>
                <li><strong>Localisation :</strong> Rebecques, France</li>
                <li><strong>Email :</strong> <a href="mailto:francoisnoel62@gmail.com" className="text-primary hover:underline">francoisnoel62@gmail.com</a></li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">2. Directeur de la publication</h2>
              <p>
                <strong>Nom :</strong> François Fanfan
              </p>
              <p>
                <strong>Contact :</strong> <a href="mailto:francoisnoel62@gmail.com" className="text-primary hover:underline">francoisnoel62@gmail.com</a>
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">3. Hébergement</h2>
              <p>Le site est hébergé par :</p>
              <ul className="list-none space-y-2 pl-0">
                <li><strong>Nom :</strong> Vercel Inc.</li>
                <li><strong>Adresse :</strong> 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis</li>
                <li><strong>Site web :</strong> <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://vercel.com</a></li>
              </ul>
              <p className="mt-4">Les données sont stockées sur :</p>
              <ul className="list-none space-y-2 pl-0">
                <li><strong>Nom :</strong> MongoDB Atlas (MongoDB, Inc.)</li>
                <li><strong>Adresse :</strong> 1633 Broadway, 38th Floor, New York, NY 10019, États-Unis</li>
                <li><strong>Site web :</strong> <a href="https://www.mongodb.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://www.mongodb.com</a></li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">4. Propriété intellectuelle</h2>
              <p>
                L&apos;ensemble du contenu du site Revise (textes, images, graphismes, logo, icônes,
                logiciels, etc.) est la propriété exclusive de l&apos;éditeur ou de ses partenaires
                et est protégé par les lois françaises et internationales relatives à la propriété
                intellectuelle.
              </p>
              <p>
                Toute reproduction, représentation, modification, publication, adaptation de tout
                ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est
                interdite, sauf autorisation écrite préalable de l&apos;éditeur.
              </p>
              <p>
                Toute exploitation non autorisée du site ou de son contenu sera considérée comme
                constitutive d&apos;une contrefaçon et poursuivie conformément aux dispositions des
                articles L.335-2 et suivants du Code de Propriété Intellectuelle.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">5. Contenus générés par les utilisateurs</h2>
              <p>
                Les textes et contenus créés par les utilisateurs via la plateforme Revise
                restent la propriété exclusive de leurs auteurs respectifs. L&apos;éditeur
                n&apos;acquiert aucun droit de propriété intellectuelle sur ces contenus.
              </p>
              <p>
                L&apos;utilisateur garantit que les contenus qu&apos;il crée ou importe sur la
                plateforme ne portent pas atteinte aux droits de tiers et n&apos;enfreignent
                aucune disposition légale ou réglementaire.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">6. Limitation de responsabilité</h2>
              <p>
                L&apos;éditeur s&apos;efforce d&apos;assurer au mieux l&apos;exactitude et la mise à jour
                des informations diffusées sur le site. Toutefois, l&apos;éditeur ne peut garantir
                l&apos;exactitude, la précision ou l&apos;exhaustivité des informations mises à
                disposition sur le site.
              </p>
              <p>
                Les suggestions de réécriture générées par l&apos;intelligence artificielle sont
                fournies à titre indicatif et ne sauraient se substituer au jugement de l&apos;auteur.
                L&apos;utilisateur reste seul responsable de l&apos;utilisation qu&apos;il fait des
                propositions générées.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">7. Droit applicable</h2>
              <p>
                Les présentes mentions légales sont régies par le droit français. En cas de litige,
                et après tentative de recherche d&apos;une solution amiable, compétence expresse est
                attribuée aux tribunaux français compétents.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">8. Contact</h2>
              <p>
                Pour toute question relative aux présentes mentions légales, vous pouvez nous
                contacter à l&apos;adresse : <a href="mailto:francoisnoel62@gmail.com" className="text-primary hover:underline">francoisnoel62@gmail.com</a>
              </p>
            </section>
          </div>

          {/* Navigation links */}
          <div className="mt-12 pt-8 border-t">
            <p className="text-sm text-muted-foreground mb-4">Voir aussi :</p>
            <div className="flex flex-wrap gap-4">
              <Link href="/politique-confidentialite" className="text-sm text-primary hover:underline">
                Politique de confidentialité
              </Link>
              <Link href="/politique-cookies" className="text-sm text-primary hover:underline">
                Politique de cookies
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
