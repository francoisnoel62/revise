// ABOUTME: Page des Conditions Générales de Vente (CGV)
// ABOUTME: Définit les conditions commerciales de l'abonnement Revise

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Conditions Générales de Vente - Revise',
  description: 'Conditions générales de vente de l\'abonnement Revise',
};

export default function CGVPage() {
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
          <h1 className="text-3xl md:text-4xl font-bold mb-8">Conditions Générales de Vente</h1>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
            <p className="text-muted-foreground">
              Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>

            <div className="rounded-lg border bg-muted/50 p-4 mb-8">
              <p className="text-sm">
                <strong>Note :</strong> Les présentes CGV s&apos;appliquent aux abonnements payants.
                Pendant la phase bêta gratuite, seules les{' '}
                <Link href="/conditions-generales-utilisation" className="text-primary hover:underline">
                  Conditions Générales d&apos;Utilisation
                </Link>{' '}
                sont applicables.
              </p>
            </div>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">1. Objet</h2>
              <p>
                Les présentes Conditions Générales de Vente (ci-après « CGV ») définissent les
                conditions contractuelles applicables à la souscription d&apos;un abonnement au
                service <strong>Revise</strong> (ci-après « le Service ») par tout utilisateur
                (ci-après « le Client »).
              </p>
              <p>
                Toute souscription implique l&apos;acceptation sans réserve des présentes CGV ainsi que
                des <Link href="/conditions-generales-utilisation" className="text-primary hover:underline">
                  Conditions Générales d&apos;Utilisation
                </Link>.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">2. Vendeur</h2>
              <p>Le Service est proposé par :</p>
              <ul className="list-none space-y-2 pl-0">
                <li><strong>Nom :</strong> François Fanfan</li>
                <li><strong>Statut :</strong> Personne physique</li>
                <li><strong>Localisation :</strong> Rebecques, France</li>
                <li><strong>Email :</strong> <a href="mailto:francoisnoel62@gmail.com" className="text-primary hover:underline">francoisnoel62@gmail.com</a></li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">3. Description de l&apos;offre</h2>
              <h3 className="text-xl font-medium">3.1 Contenu de l&apos;abonnement</h3>
              <p>
                L&apos;abonnement Revise donne accès à l&apos;ensemble des fonctionnalités du Service,
                notamment :
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Éditeur de texte professionnel avec sauvegarde automatique</li>
                <li>Organisation par projets et chapitres illimités</li>
                <li>Réécriture assistée par IA avec propositions stylistiques</li>
                <li>Outils d&apos;analyse narrative (personnages, intrigue, style, worldbuilding)</li>
                <li>Import et export de documents (DOCX, PDF)</li>
                <li>Historique des corrections</li>
              </ul>
              <h3 className="text-xl font-medium">3.2 Tarifs</h3>
              <p>
                Le prix de l&apos;abonnement mensuel est de <strong>9,90 € TTC</strong> par mois.
                Ce tarif est susceptible d&apos;évoluer. Toute modification tarifaire sera communiquée
                au Client au moins 30 jours avant son entrée en vigueur.
              </p>
              <p>
                Les tarifs affichés incluent toutes les taxes applicables (TVA française au taux
                en vigueur).
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">4. Souscription et paiement</h2>
              <h3 className="text-xl font-medium">4.1 Processus de souscription</h3>
              <p>
                Pour souscrire à l&apos;abonnement, le Client doit :
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Disposer d&apos;un compte utilisateur validé</li>
                <li>Accepter les présentes CGV et les CGU</li>
                <li>Procéder au paiement selon les modalités proposées</li>
              </ul>
              <h3 className="text-xl font-medium">4.2 Moyens de paiement</h3>
              <p>
                Le paiement s&apos;effectue par carte bancaire via notre prestataire de paiement
                sécurisé. Les données bancaires sont traitées de manière chiffrée et ne sont
                jamais stockées sur nos serveurs.
              </p>
              <h3 className="text-xl font-medium">4.3 Facturation</h3>
              <p>
                L&apos;abonnement est facturé mensuellement, à date anniversaire de la souscription.
                Une facture électronique est envoyée par email après chaque paiement.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">5. Droit de rétractation</h2>
              <p>
                Conformément aux articles L.221-18 et suivants du Code de la consommation, le
                Client dispose d&apos;un délai de <strong>14 jours</strong> à compter de la souscription
                pour exercer son droit de rétractation, sans avoir à justifier de motifs ni à
                payer de pénalités.
              </p>
              <p>
                Pour exercer ce droit, le Client doit notifier sa décision par email à l&apos;adresse{' '}
                <a href="mailto:francoisnoel62@gmail.com" className="text-primary hover:underline">francoisnoel62@gmail.com</a>{' '}
                en indiquant clairement sa volonté de se rétracter.
              </p>
              <p>
                En cas de rétractation, le remboursement sera effectué dans un délai de 14 jours
                suivant la notification, via le même moyen de paiement que celui utilisé pour
                la transaction initiale.
              </p>
              <p>
                <strong>Renonciation au droit de rétractation :</strong> Si le Client a commencé
                à utiliser le Service avant l&apos;expiration du délai de rétractation, il reconnaît
                et accepte que l&apos;exécution du contrat a commencé et que le remboursement sera
                calculé au prorata de l&apos;utilisation.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">6. Durée et renouvellement</h2>
              <h3 className="text-xl font-medium">6.1 Durée</h3>
              <p>
                L&apos;abonnement est souscrit pour une durée d&apos;un mois, renouvelable par
                tacite reconduction.
              </p>
              <h3 className="text-xl font-medium">6.2 Renouvellement automatique</h3>
              <p>
                Sauf résiliation par le Client, l&apos;abonnement est automatiquement reconduit
                chaque mois. Le Client est informé de chaque renouvellement par l&apos;envoi
                d&apos;une facture.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">7. Résiliation</h2>
              <h3 className="text-xl font-medium">7.1 Résiliation par le Client</h3>
              <p>
                Le Client peut résilier son abonnement à tout moment depuis son espace personnel
                ou par email. La résiliation prend effet à la fin de la période en cours déjà payée.
                Aucun remboursement au prorata n&apos;est effectué pour la période restante.
              </p>
              <h3 className="text-xl font-medium">7.2 Résiliation par le vendeur</h3>
              <p>
                Le vendeur se réserve le droit de résilier l&apos;abonnement en cas de :
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Violation des CGU ou des présentes CGV</li>
                <li>Défaut de paiement</li>
                <li>Utilisation frauduleuse du Service</li>
              </ul>
              <p>
                En cas de résiliation pour manquement du Client, aucun remboursement ne sera effectué.
              </p>
              <h3 className="text-xl font-medium">7.3 Conséquences de la résiliation</h3>
              <p>
                À l&apos;expiration de l&apos;abonnement, l&apos;accès aux fonctionnalités premium
                est suspendu. Le Client conserve l&apos;accès à ses données pendant 30 jours pour
                les exporter. Au-delà, les données pourront être supprimées conformément à notre
                politique de confidentialité.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">8. Garanties et responsabilité</h2>
              <h3 className="text-xl font-medium">8.1 Garantie légale</h3>
              <p>
                Le Service bénéficie de la garantie légale de conformité prévue aux articles
                L.217-4 et suivants du Code de la consommation, ainsi que de la garantie des
                vices cachés prévue aux articles 1641 et suivants du Code civil.
              </p>
              <h3 className="text-xl font-medium">8.2 Limitation de responsabilité</h3>
              <p>
                Les limitations de responsabilité prévues dans les{' '}
                <Link href="/conditions-generales-utilisation" className="text-primary hover:underline">
                  Conditions Générales d&apos;Utilisation
                </Link>{' '}
                s&apos;appliquent également dans le cadre de l&apos;abonnement payant.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">9. Protection des données</h2>
              <p>
                Les données personnelles collectées dans le cadre de la souscription et de
                l&apos;utilisation du Service sont traitées conformément à notre{' '}
                <Link href="/politique-confidentialite" className="text-primary hover:underline">
                  Politique de confidentialité
                </Link>.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">10. Service client et réclamations</h2>
              <p>
                Pour toute question, demande d&apos;assistance ou réclamation relative à
                l&apos;abonnement, le Client peut contacter le service client par email à
                l&apos;adresse : <a href="mailto:francoisnoel62@gmail.com" className="text-primary hover:underline">francoisnoel62@gmail.com</a>
              </p>
              <p>
                Nous nous engageons à répondre à toute réclamation dans un délai de 30 jours.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">11. Médiation</h2>
              <p>
                Conformément aux articles L.611-1 et suivants du Code de la consommation, en cas
                de litige non résolu avec notre service client, le Client peut recourir gratuitement
                au service de médiation. Le médiateur de la consommation compétent sera communiqué
                sur demande.
              </p>
              <p>
                Le Client peut également utiliser la plateforme européenne de règlement en ligne
                des litiges accessible à l&apos;adresse :{' '}
                <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  https://ec.europa.eu/consumers/odr
                </a>
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">12. Modification des CGV</h2>
              <p>
                Le vendeur se réserve le droit de modifier les présentes CGV. Les modifications
                seront communiquées au Client par email au moins 30 jours avant leur entrée en
                vigueur. Le Client qui n&apos;accepte pas les nouvelles conditions peut résilier
                son abonnement avant leur application.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">13. Droit applicable et juridiction</h2>
              <p>
                Les présentes CGV sont régies par le droit français. En cas de litige, et après
                tentative de résolution amiable ou de médiation, compétence est attribuée aux
                tribunaux français compétents.
              </p>
            </section>
          </div>

          {/* Navigation links */}
          <div className="mt-12 pt-8 border-t">
            <p className="text-sm text-muted-foreground mb-4">Voir aussi :</p>
            <div className="flex flex-wrap gap-4">
              <Link href="/conditions-generales-utilisation" className="text-sm text-primary hover:underline">
                Conditions Générales d&apos;Utilisation
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
