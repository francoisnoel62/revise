// ABOUTME: Page de politique de confidentialité conforme au RGPD
// ABOUTME: Décrit le traitement des données personnelles, droits des utilisateurs et sous-traitants

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Politique de confidentialité - Revise',
  description: 'Politique de confidentialité et protection des données personnelles de Revise',
};

export default function PolitiqueConfidentialitePage() {
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
          <h1 className="text-3xl md:text-4xl font-bold mb-8">Politique de confidentialité</h1>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
            <p className="text-muted-foreground">
              Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>

            <p className="text-lg">
              Chez Revise, nous accordons une importance primordiale à la protection de vos données
              personnelles. Cette politique de confidentialité vous informe de la manière dont nous
              collectons, utilisons et protégeons vos informations conformément au Règlement Général
              sur la Protection des Données (RGPD).
            </p>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">1. Responsable du traitement</h2>
              <p>Le responsable du traitement des données personnelles est :</p>
              <ul className="list-none space-y-2 pl-0">
                <li><strong>Nom / Raison sociale :</strong> <span className="text-primary">[À COMPLÉTER]</span></li>
                <li><strong>Adresse :</strong> <span className="text-primary">[À COMPLÉTER]</span></li>
                <li><strong>Email de contact (DPO) :</strong> <span className="text-primary">[À COMPLÉTER]</span></li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">2. Données collectées</h2>
              <p>Nous collectons les catégories de données suivantes :</p>

              <h3 className="text-xl font-medium mt-6">2.1 Données d&apos;identification</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Adresse email</li>
                <li>Nom (optionnel)</li>
                <li>Mot de passe (hashé avec bcrypt, jamais stocké en clair)</li>
              </ul>

              <h3 className="text-xl font-medium mt-6">2.2 Données de contenu</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Projets d&apos;écriture (titres, chapitres, textes)</li>
                <li>Métadonnées d&apos;analyse générées par l&apos;IA</li>
                <li>Historique des corrections (texte original, propositions, texte choisi)</li>
              </ul>

              <h3 className="text-xl font-medium mt-6">2.3 Données techniques</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Adresse IP (logs serveur)</li>
                <li>Données de session (cookies d&apos;authentification)</li>
                <li>Horodatages de création et modification</li>
              </ul>

              <h3 className="text-xl font-medium mt-6">2.4 Clés API (optionnel)</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Clés API de fournisseurs IA (OpenAI, Anthropic, etc.)</li>
                <li>Ces clés sont chiffrées avec AES-256-GCM avant stockage</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">3. Finalités du traitement</h2>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4">Finalité</th>
                    <th className="text-left py-2">Base légale</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b">
                    <td className="py-2 pr-4">Création et gestion de compte utilisateur</td>
                    <td className="py-2">Exécution du contrat</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4">Sauvegarde et synchronisation des projets</td>
                    <td className="py-2">Exécution du contrat</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4">Génération de propositions de réécriture par IA</td>
                    <td className="py-2">Exécution du contrat</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4">Analyse narrative et métadonnées</td>
                    <td className="py-2">Exécution du contrat</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4">Historique des corrections</td>
                    <td className="py-2">Exécution du contrat</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4">Sécurité et prévention des fraudes</td>
                    <td className="py-2">Intérêt légitime</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4">Amélioration du service (analytics anonymisés)</td>
                    <td className="py-2">Intérêt légitime</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">4. Destinataires des données</h2>
              <p>Vos données peuvent être transmises aux sous-traitants suivants :</p>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4">Sous-traitant</th>
                      <th className="text-left py-2 pr-4">Finalité</th>
                      <th className="text-left py-2">Localisation</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 pr-4">Vercel Inc.</td>
                      <td className="py-2 pr-4">Hébergement de l&apos;application</td>
                      <td className="py-2">États-Unis (certifié DPF)</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4">MongoDB, Inc.</td>
                      <td className="py-2 pr-4">Stockage des données (Atlas)</td>
                      <td className="py-2">États-Unis (certifié DPF)</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4">OpenAI, LLC</td>
                      <td className="py-2 pr-4">Génération IA (si configuré)</td>
                      <td className="py-2">États-Unis (certifié DPF)</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4">Anthropic</td>
                      <td className="py-2 pr-4">Génération IA (si configuré)</td>
                      <td className="py-2">États-Unis (certifié DPF)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="text-sm text-muted-foreground mt-4">
                DPF = EU-U.S. Data Privacy Framework. Ces transferts sont encadrés par des garanties
                appropriées conformément à l&apos;article 46 du RGPD.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">5. Traitement par l&apos;IA</h2>
              <p>
                Lorsque vous utilisez la fonctionnalité de réécriture ou d&apos;analyse, les
                extraits de texte sélectionnés sont envoyés aux API d&apos;intelligence artificielle
                (OpenAI ou Anthropic, selon votre configuration) pour générer des propositions.
              </p>
              <p><strong>Important :</strong></p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Seuls les textes que vous soumettez explicitement sont envoyés</li>
                <li>Les fournisseurs IA n&apos;utilisent pas vos données pour entraîner leurs modèles (API usage)</li>
                <li>Vous pouvez utiliser vos propres clés API pour un contrôle total</li>
                <li>L&apos;historique des corrections est stocké localement dans votre compte</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">6. Durée de conservation</h2>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4">Type de données</th>
                    <th className="text-left py-2">Durée de conservation</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b">
                    <td className="py-2 pr-4">Compte utilisateur</td>
                    <td className="py-2">Jusqu&apos;à suppression du compte + 30 jours</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4">Projets et contenus</td>
                    <td className="py-2">Jusqu&apos;à suppression du compte</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4">Historique des corrections</td>
                    <td className="py-2">Jusqu&apos;à suppression du compte</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4">Clés API chiffrées</td>
                    <td className="py-2">Jusqu&apos;à suppression par l&apos;utilisateur</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4">Logs techniques</td>
                    <td className="py-2">12 mois</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">7. Vos droits</h2>
              <p>Conformément au RGPD, vous disposez des droits suivants :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Droit d&apos;accès :</strong> obtenir une copie de vos données personnelles
                </li>
                <li>
                  <strong>Droit de rectification :</strong> corriger des données inexactes ou incomplètes
                </li>
                <li>
                  <strong>Droit à l&apos;effacement :</strong> demander la suppression de vos données
                  (&quot;droit à l&apos;oubli&quot;)
                </li>
                <li>
                  <strong>Droit à la limitation :</strong> restreindre le traitement de vos données
                </li>
                <li>
                  <strong>Droit à la portabilité :</strong> recevoir vos données dans un format structuré
                  (export DOCX disponible)
                </li>
                <li>
                  <strong>Droit d&apos;opposition :</strong> vous opposer au traitement de vos données
                </li>
              </ul>

              <p className="mt-4">
                Pour exercer ces droits, contactez-nous à :{' '}
                <span className="text-primary">[EMAIL DPO À COMPLÉTER]</span>
              </p>

              <p className="mt-4">
                Vous avez également le droit d&apos;introduire une réclamation auprès de la CNIL
                (Commission Nationale de l&apos;Informatique et des Libertés) :{' '}
                <a
                  href="https://www.cnil.fr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  www.cnil.fr
                </a>
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">8. Sécurité des données</h2>
              <p>Nous mettons en œuvre des mesures de sécurité appropriées :</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Chiffrement des communications (HTTPS/TLS)</li>
                <li>Hashage des mots de passe (bcrypt)</li>
                <li>Chiffrement des clés API (AES-256-GCM)</li>
                <li>Isolation multi-tenant des données</li>
                <li>Authentification sécurisée (Auth.js)</li>
                <li>Sessions avec expiration automatique</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">9. Cookies</h2>
              <p>
                Nous utilisons des cookies strictement nécessaires au fonctionnement du service.
                Pour plus d&apos;informations, consultez notre{' '}
                <Link href="/politique-cookies" className="text-primary hover:underline">
                  Politique de cookies
                </Link>
                .
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">10. Modifications</h2>
              <p>
                Nous pouvons mettre à jour cette politique de confidentialité. En cas de modification
                substantielle, nous vous informerons par email ou via une notification sur le site.
                Nous vous encourageons à consulter régulièrement cette page.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">11. Contact</h2>
              <p>
                Pour toute question relative à cette politique ou à vos données personnelles,
                contactez-nous :
              </p>
              <ul className="list-none space-y-2 pl-0">
                <li><strong>Email :</strong> <span className="text-primary">[À COMPLÉTER]</span></li>
                <li><strong>Adresse :</strong> <span className="text-primary">[À COMPLÉTER]</span></li>
              </ul>
            </section>
          </div>

          {/* Navigation links */}
          <div className="mt-12 pt-8 border-t">
            <p className="text-sm text-muted-foreground mb-4">Voir aussi :</p>
            <div className="flex flex-wrap gap-4">
              <Link href="/mentions-legales" className="text-sm text-primary hover:underline">
                Mentions légales
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
