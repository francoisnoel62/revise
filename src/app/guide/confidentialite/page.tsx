// ABOUTME: Guide « Vos données & votre sécurité » — propriété des écrits, chiffrement, export et suppression de compte.
// ABOUTME: Résume les mécanismes présents dans l'application et renvoie aux pages légales pour le détail.

import Link from 'next/link';

export const metadata = {
  title: 'Vos données & votre sécurité dans Revise',
  description:
    "Vos écrits restent les vôtres. Clés API et journal IA facultatif chiffrés, export et suppression depuis les paramètres.",
};

export default function GuideConfidentialitePage() {
  return (
    <main className="container mx-auto px-4 py-12 md:py-20">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-medium text-muted-foreground mb-3">Guide · Données &amp; sécurité</p>
        <h1 className="text-3xl md:text-4xl font-bold mb-6">Vos données &amp; votre sécurité</h1>
        <p className="text-lg text-muted-foreground mb-10">
          Un auteur confie son œuvre à Revise. Ce n&apos;est pas un détail technique, c&apos;est un
          pacte. Voici, concrètement, comment nous le respectons.
        </p>

        <div className="space-y-8">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Vos écrits vous appartiennent</h2>
            <p>
              Les textes que vous créez ou importez restent <strong>votre propriété</strong>. Revise
              ne les utilise pas pour entraîner ses propres modèles. Quand vous utilisez une fonction
              IA, le contexte nécessaire est transmis au fournisseur que vous avez configuré ; ses
              propres conditions s&apos;appliquent alors également.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Isolation par compte</h2>
            <p>
              Les actions de l&apos;application vérifient le compte propriétaire avant d&apos;accéder à un
              projet. Un lien de lecture public ne donne accès qu&apos;au projet et aux chapitres que son
              auteur a choisi de partager.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Chiffrement &amp; authentification</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Vos clés API sont chiffrées en <strong>AES-256-GCM</strong> et jamais exposées côté navigateur.</li>
              <li>Vos mots de passe sont hachés avec <strong>bcrypt</strong>.</li>
              <li>L&apos;accès est protégé contre les abus par un <strong>rate limiting</strong> ; hCaptcha est utilisé à l&apos;inscription lorsqu&apos;il est configuré.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Journal de transparence IA</h2>
            <p>
              Vous pouvez activer, en <strong>opt-in</strong>, un journal qui conserve le contenu
              exact envoyé à l&apos;IA et sa réponse — pour savoir précisément ce qui a été partagé,
              plutôt que de le deviner. Ce contenu est chiffré au repos avec une clé distincte de
              celle de vos clés API, et purgé automatiquement après la durée de rétention que vous
              choisissez. C&apos;est désactivé par défaut : Revise ne conserve rien de plus que le
              nécessaire sans votre accord explicite.
            </p>
            <p>
              Consultez et gérez ce journal depuis{' '}
              <Link href="/historique-ia" className="text-primary hover:underline">
                votre historique IA
              </Link>
              .
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Vos droits RGPD, en pratique</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Export de vos données</strong> personnelles (droit à la portabilité, article 20).</li>
              <li><strong>Suppression de compte</strong> avec effacement de toutes les données associées.</li>
              <li><strong>Préférences de cookies</strong> décrites dans la politique de cookies.</li>
            </ul>
            <p>
              Ces actions se gèrent depuis vos{' '}
              <Link href="/settings" className="text-primary hover:underline">paramètres</Link>.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Documents juridiques</h2>
            <p>Pour le détail complet, consultez nos pages dédiées :</p>
            <div className="flex flex-wrap gap-4">
              <Link href="/conditions-generales-utilisation" className="text-sm text-primary hover:underline">CGU</Link>
              <Link href="/conditions-generales-vente" className="text-sm text-primary hover:underline">CGV</Link>
              <Link href="/mentions-legales" className="text-sm text-primary hover:underline">Mentions légales</Link>
              <Link href="/politique-confidentialite" className="text-sm text-primary hover:underline">Politique de confidentialité</Link>
              <Link href="/politique-cookies" className="text-sm text-primary hover:underline">Politique de cookies</Link>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t">
          <p className="text-sm text-muted-foreground mb-4">Voir aussi :</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/guide/providers" className="text-sm text-primary hover:underline">Configurer l&apos;IA</Link>
            <Link href="/guide/demarrer" className="text-sm text-primary hover:underline">Premiers pas</Link>
            <Link href="/guide" className="text-sm text-primary hover:underline">Retour au guide</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
