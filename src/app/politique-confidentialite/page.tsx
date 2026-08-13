// ABOUTME: Privacy information grounded in the data flows implemented by the application.
// ABOUTME: Legal review remains necessary for any change in hosting, providers, or commercial offer.

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Politique de confidentialité - Revise',
  description: 'Données traitées par Revise et fonctionnement des fonctions IA',
};

export default function PolitiqueConfidentialitePage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2"><span className="text-xl font-bold">Revise</span></Link>
            <Link href="/"><Button variant="ghost" size="sm"><ArrowLeft className="mr-2 h-4 w-4" />Retour à l&apos;accueil</Button></Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-12 md:py-20">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">Politique de confidentialité</h1>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
            <p className="text-muted-foreground">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="text-lg">
              Cette page décrit les flux de données de l&apos;application Revise tels qu&apos;ils sont
              implémentés aujourd&apos;hui. Elle doit être relue juridiquement avant tout changement
              d&apos;hébergement, de fournisseur IA ou d&apos;offre commerciale.
            </p>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">1. Responsable et contact</h2>
              <p>
                Pour toute question relative à vos données :{' '}
                <a href="mailto:francoisnoel62@gmail.com" className="text-primary hover:underline">francoisnoel62@gmail.com</a>.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">2. Données traitées par l&apos;application</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Compte : adresse e-mail, nom facultatif, mot de passe sous forme de hash bcrypt et statut d&apos;accès.</li>
                <li>Écriture : projets, chapitres, paramètres éditoriaux, recherches, annexes, tâches, objectifs, personnages, faits de canon et métadonnées.</li>
                <li>Historique : corrections et instantanés lorsque ces fonctions sont utilisées.</li>
                <li>Fournisseurs IA : type, modèle et clé API chiffrée lorsqu&apos;une clé est enregistrée.</li>
                <li>Statistiques d&apos;autocomplétion facultatives : compte, projet, modèle, durée, longueur et issue de la suggestion ; le texte de la suggestion n&apos;y est pas enregistré.</li>
                <li>Journal IA facultatif : requête, consigne système et réponse, seulement lorsque son enregistrement est activé.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">3. Fonctions IA et contexte transmis</h2>
              <p>
                Revise utilise le fournisseur configuré dans votre compte : OpenAI, Anthropic ou
                Google. Les opérations IA transmettent le contenu nécessaire à la demande. Dans le
                chemin d&apos;autocomplétion en flux de l&apos;éditeur, cela comprend notamment le texte autour
                du curseur, des chapitres antérieurs et des faits de canon sélectionnés.
              </p>
              <p>
                Le préchargement discret, s&apos;il est activé dans les préférences du projet, peut préparer
                une suggestion après une pause de saisie avant que vous n&apos;appuyiez sur Tab. Les documents
                de recherche ne sont pas injectés par ce flux d&apos;autocomplétion ; ils peuvent en revanche
                servir de contexte dans d&apos;autres opérations IA prévues à cet effet.
              </p>
              <p>
                Les règles de conservation et d&apos;utilisation des données par chaque fournisseur relèvent
                de ses propres conditions. Revise ne présente pas cette page comme une garantie sur leurs
                politiques externes.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">4. Stockage et mesures techniques</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Les données applicatives sont persistées dans MongoDB ; les couvertures peuvent être stockées dans Vercel Blob.</li>
                <li>Les clés API enregistrées sont chiffrées au repos en AES-256-GCM avec une clé dérivée par PBKDF2.</li>
                <li>Le contenu du journal IA facultatif est chiffré séparément en AES-256-GCM avant stockage.</li>
                <li>Les manuscrits et projets ne font pas l&apos;objet d&apos;un chiffrement champ par champ par l&apos;application actuelle.</li>
                <li>L&apos;authentification utilise une session JWT ; les accès aux données applicatives sont contrôlés par le compte propriétaire et certaines routes sont limitées contre les abus.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">5. Destinataires techniques</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead><tr className="border-b"><th className="text-left py-2 pr-4">Service</th><th className="text-left py-2">Utilisation dans Revise</th></tr></thead>
                  <tbody>
                    <tr className="border-b"><td className="py-2 pr-4">MongoDB</td><td className="py-2">Persistance des données applicatives.</td></tr>
                    <tr className="border-b"><td className="py-2 pr-4">Vercel Blob</td><td className="py-2">Stockage des images de couverture lorsqu&apos;elles sont téléversées.</td></tr>
                    <tr className="border-b"><td className="py-2 pr-4">OpenAI, Anthropic ou Google</td><td className="py-2">Traitement d&apos;une demande IA avec le fournisseur configuré.</td></tr>
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-muted-foreground">Les garanties contractuelles, localisations et mécanismes de transfert de ces services doivent être vérifiés dans leurs politiques respectives.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">6. Durées visibles dans le produit</h2>
              <table className="w-full border-collapse text-sm">
                <thead><tr className="border-b"><th className="text-left py-2 pr-4">Donnée</th><th className="text-left py-2">Comportement implémenté</th></tr></thead>
                <tbody>
                  <tr className="border-b"><td className="py-2 pr-4">Compte, projets et historiques</td><td className="py-2">Conservés jusqu&apos;à leur suppression par l&apos;utilisateur ou à la suppression du compte.</td></tr>
                  <tr className="border-b"><td className="py-2 pr-4">Clé API</td><td className="py-2">Conservée jusqu&apos;à sa suppression ou à la suppression du compte.</td></tr>
                  <tr className="border-b"><td className="py-2 pr-4">Journal IA facultatif</td><td className="py-2">Durée choisie par l&apos;utilisateur, de 1 à 365 jours ; une expiration est enregistrée pour chaque échange.</td></tr>
                </tbody>
              </table>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">7. Accès, export et suppression</h2>
              <p>
                Les paramètres du compte permettent d&apos;exporter les données personnelles dans un
                format JSON et de demander l&apos;effacement du compte avec les données associées. Vous
                pouvez aussi nous contacter à l&apos;adresse indiquée plus haut pour exercer vos droits.
              </p>
              <p>
                Pour les droits prévus par le RGPD et une réclamation éventuelle, vous pouvez consulter{' '}
                <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">le site de la CNIL</a>.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">8. Cookies</h2>
              <p>
                Les cookies de connexion, de préférence d&apos;interface et de lecture du blog sont détaillés
                dans la{' '}<Link href="/politique-cookies" className="text-primary hover:underline">politique de cookies</Link>.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t">
            <p className="text-sm text-muted-foreground mb-4">Voir aussi :</p>
            <div className="flex flex-wrap gap-4">
              <Link href="/conditions-generales-utilisation" className="text-sm text-primary hover:underline">Conditions Générales d&apos;Utilisation</Link>
              <Link href="/conditions-generales-vente" className="text-sm text-primary hover:underline">Conditions Générales de Vente</Link>
              <Link href="/mentions-legales" className="text-sm text-primary hover:underline">Mentions légales</Link>
              <Link href="/politique-cookies" className="text-sm text-primary hover:underline">Politique de cookies</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
