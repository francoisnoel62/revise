// ABOUTME: Page des Conditions Générales d'Utilisation (CGU)
// ABOUTME: Définit les règles d'utilisation du service Revise

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Conditions Générales d\'Utilisation - Revise',
  description: 'Conditions générales d\'utilisation du service Revise, assistant IA pour les auteurs de fiction',
};

export default function CGUPage() {
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
          <h1 className="text-3xl md:text-4xl font-bold mb-8">Conditions Générales d&apos;Utilisation</h1>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
            <p className="text-muted-foreground">
              Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">1. Objet</h2>
              <p>
                Les présentes Conditions Générales d&apos;Utilisation (ci-après « CGU ») ont pour objet
                de définir les modalités et conditions d&apos;utilisation du service <strong>Revise</strong>
                (ci-après « le Service »), accessible à l&apos;adresse{' '}
                <a href="https://revise.studio" className="text-primary hover:underline">https://revise.studio</a>.
              </p>
              <p>
                En créant un compte et en utilisant le Service, l&apos;utilisateur accepte sans réserve
                les présentes CGU. Si l&apos;utilisateur n&apos;accepte pas ces conditions, il ne doit pas
                utiliser le Service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">2. Description du Service</h2>
              <p>
                Revise est un assistant d&apos;écriture alimenté par l&apos;intelligence artificielle,
                conçu spécifiquement pour les auteurs de fiction. Le Service propose notamment :
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Un éditeur de texte professionnel avec organisation par projets et chapitres</li>
                <li>Des fonctionnalités de réécriture assistée par IA avec propositions stylistiques</li>
                <li>Des outils d&apos;analyse narrative (personnages, intrigue, style, worldbuilding)</li>
                <li>L&apos;import et l&apos;export de documents aux formats DOCX et PDF</li>
                <li>La sauvegarde automatique des travaux</li>
              </ul>
              <p>
                Le Service est fourni en l&apos;état et peut évoluer. L&apos;éditeur se réserve le droit
                de modifier, suspendre ou interrompre tout ou partie des fonctionnalités sans préavis.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">3. Accès au Service</h2>
              <h3 className="text-xl font-medium">3.1 Inscription</h3>
              <p>
                L&apos;accès au Service nécessite la création d&apos;un compte utilisateur. L&apos;utilisateur
                doit fournir des informations exactes et à jour lors de l&apos;inscription. Tout compte créé
                avec des informations frauduleuses pourra être supprimé sans préavis.
              </p>
              <h3 className="text-xl font-medium">3.2 Phase bêta</h3>
              <p>
                Pendant la phase bêta, l&apos;accès au Service est gratuit et soumis à validation par
                l&apos;administrateur. L&apos;éditeur se réserve le droit d&apos;accepter ou de refuser
                toute demande d&apos;inscription sans avoir à justifier sa décision.
              </p>
              <h3 className="text-xl font-medium">3.3 Sécurité du compte</h3>
              <p>
                L&apos;utilisateur est responsable de la confidentialité de ses identifiants de connexion.
                Toute activité effectuée depuis son compte est réputée avoir été réalisée par lui.
                En cas de compromission suspectée, l&apos;utilisateur doit immédiatement contacter l&apos;éditeur.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">4. Utilisation du Service</h2>
              <h3 className="text-xl font-medium">4.1 Usages autorisés</h3>
              <p>
                Le Service est destiné à un usage personnel ou professionnel dans le cadre de la
                création littéraire. L&apos;utilisateur s&apos;engage à utiliser le Service de manière
                loyale et conforme aux présentes CGU.
              </p>
              <h3 className="text-xl font-medium">4.2 Usages interdits</h3>
              <p>Sont strictement interdits :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>L&apos;utilisation du Service pour générer des contenus illégaux, diffamatoires,
                    discriminatoires, haineux ou portant atteinte aux droits des tiers</li>
                <li>La revente, la redistribution ou l&apos;exploitation commerciale du Service
                    sans autorisation écrite préalable</li>
                <li>Toute tentative de contournement des mesures de sécurité ou d&apos;accès
                    non autorisé aux systèmes</li>
                <li>L&apos;utilisation de robots, scripts ou tout autre moyen automatisé pour
                    accéder au Service de manière abusive</li>
                <li>Le partage de compte avec des tiers</li>
              </ul>
              <h3 className="text-xl font-medium">4.3 Sanctions</h3>
              <p>
                En cas de violation des présentes CGU, l&apos;éditeur se réserve le droit de suspendre
                ou supprimer le compte de l&apos;utilisateur, sans préavis ni indemnité, et sans préjudice
                de tout recours judiciaire.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">5. Propriété intellectuelle</h2>
              <h3 className="text-xl font-medium">5.1 Contenus de l&apos;utilisateur</h3>
              <p>
                L&apos;utilisateur conserve l&apos;intégralité des droits de propriété intellectuelle
                sur les contenus qu&apos;il crée, importe ou modifie via le Service. L&apos;éditeur
                n&apos;acquiert aucun droit sur ces contenus.
              </p>
              <p>
                L&apos;utilisateur garantit qu&apos;il dispose des droits nécessaires sur les contenus
                qu&apos;il importe et que ceux-ci ne portent pas atteinte aux droits de tiers.
              </p>
              <h3 className="text-xl font-medium">5.2 Contenus générés par l&apos;IA</h3>
              <p>
                Les textes générés par l&apos;intelligence artificielle à partir des demandes de
                l&apos;utilisateur sont considérés comme des propositions que l&apos;utilisateur est
                libre d&apos;accepter, modifier ou refuser. L&apos;utilisateur assume la responsabilité
                éditoriale de tout contenu qu&apos;il choisit d&apos;intégrer à son œuvre.
              </p>
              <h3 className="text-xl font-medium">5.3 Propriété du Service</h3>
              <p>
                Le Service, son interface, son code source, ses fonctionnalités et son design sont
                la propriété exclusive de l&apos;éditeur et sont protégés par le droit de la propriété
                intellectuelle. Toute reproduction ou utilisation non autorisée est interdite.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">6. Données personnelles</h2>
              <p>
                Le traitement des données personnelles est régi par notre{' '}
                <Link href="/politique-confidentialite" className="text-primary hover:underline">
                  Politique de confidentialité
                </Link>, qui fait partie intégrante des présentes CGU.
              </p>
              <p>
                En utilisant le Service, l&apos;utilisateur reconnaît avoir pris connaissance de
                cette politique et consent au traitement de ses données conformément à celle-ci.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">7. Limitation de responsabilité</h2>
              <h3 className="text-xl font-medium">7.1 Disponibilité du Service</h3>
              <p>
                L&apos;éditeur s&apos;efforce d&apos;assurer la disponibilité du Service mais ne peut
                garantir un fonctionnement ininterrompu. Des interruptions pour maintenance,
                mise à jour ou cas de force majeure peuvent survenir.
              </p>
              <h3 className="text-xl font-medium">7.2 Qualité des suggestions IA</h3>
              <p>
                Les propositions générées par l&apos;intelligence artificielle sont fournies à titre
                indicatif et ne constituent pas des conseils professionnels. L&apos;utilisateur
                reste seul juge de la pertinence et de la qualité des suggestions qu&apos;il choisit
                d&apos;utiliser.
              </p>
              <h3 className="text-xl font-medium">7.3 Exclusion de garantie</h3>
              <p>
                Le Service est fourni « en l&apos;état ». L&apos;éditeur ne garantit pas que le Service
                répondra aux attentes spécifiques de l&apos;utilisateur. En aucun cas l&apos;éditeur
                ne pourra être tenu responsable des dommages indirects (perte de données, perte
                d&apos;exploitation, préjudice commercial) résultant de l&apos;utilisation du Service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">8. Modification des CGU</h2>
              <p>
                L&apos;éditeur se réserve le droit de modifier les présentes CGU à tout moment.
                Les utilisateurs seront informés des modifications substantielles par email ou
                par notification sur le Service. La poursuite de l&apos;utilisation du Service
                après modification vaut acceptation des nouvelles conditions.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">9. Résiliation</h2>
              <p>
                L&apos;utilisateur peut à tout moment supprimer son compte en contactant l&apos;éditeur.
                La suppression du compte entraîne la suppression définitive de toutes les données
                associées, conformément à notre politique de confidentialité.
              </p>
              <p>
                L&apos;éditeur peut résilier le compte d&apos;un utilisateur en cas de violation des
                présentes CGU, avec ou sans préavis selon la gravité de la violation.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">10. Droit applicable et juridiction</h2>
              <p>
                Les présentes CGU sont régies par le droit français. En cas de litige relatif
                à l&apos;interprétation ou l&apos;exécution des présentes, et après tentative de
                résolution amiable, compétence exclusive est attribuée aux tribunaux français.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">11. Contact</h2>
              <p>
                Pour toute question relative aux présentes CGU, vous pouvez nous contacter à
                l&apos;adresse : <a href="mailto:francoisnoel62@gmail.com" className="text-primary hover:underline">francoisnoel62@gmail.com</a>
              </p>
            </section>
          </div>

          {/* Navigation links */}
          <div className="mt-12 pt-8 border-t">
            <p className="text-sm text-muted-foreground mb-4">Voir aussi :</p>
            <div className="flex flex-wrap gap-4">
              <Link href="/conditions-generales-vente" className="text-sm text-primary hover:underline">
                Conditions Générales de Vente
              </Link>
              <Link href="/politique-confidentialite" className="text-sm text-primary hover:underline">
                Politique de confidentialité
              </Link>
              <Link href="/mentions-legales" className="text-sm text-primary hover:underline">
                Mentions légales
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
