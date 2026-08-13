// ABOUTME: Page d'accueil du Guide Revise — hub orienté tâches qui dirige l'auteur vers la bonne page d'aide.
// ABOUTME: Pensée comme un outil marketing : tout le contenu est statique (SSR) pour le SEO et les assistants IA.

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Rocket,
  PenLine,
  Sparkles,
  BookOpen,
  BookMarked,
  Users,
  Microscope,
  LayoutDashboard,
  KeyRound,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

export const metadata = {
  title: 'Guide Revise — Apprendre à écrire avec votre co-auteur IA',
  description:
    "Le guide complet de Revise : démarrer en 5 minutes, réécrire, gérer son manuscrit, dialoguer avec ses personnages, analyser son texte et piloter son projet. Conçu pour les auteurs de fiction.",
};

const categories = [
  {
    href: '/guide/demarrer',
    icon: Rocket,
    title: 'Premiers pas',
    description:
      "Créez votre compte, connectez une IA et vivez votre première réécriture en moins de 5 minutes.",
  },
  {
    href: '/guide/editeur',
    icon: PenLine,
    title: "L'éditeur",
    description:
      "L'écriture du manuscrit, le compteur de mots, la sauvegarde automatique et les raccourcis clavier.",
  },
  {
    href: '/guide/assistant-ia',
    icon: Sparkles,
    title: "Les outils d'écriture IA",
    description:
      "Réécriture en 3 styles, palette de commandes, autocomplétion au Tab et génération de texte — sans quitter votre flow.",
  },
  {
    href: '/guide/manuscrit',
    icon: BookOpen,
    title: 'Gérer son manuscrit',
    description:
      "Chapitres, import .docx et Markdown, export DOCX/PDF, image de couverture, temps de lecture et partage public.",
  },
  {
    href: '/guide/publication',
    icon: BookMarked,
    title: 'Profils de publication',
    description:
      "KDP 6×9, A5 ou passerelle : choisissez un profil d'impression, personnalisez la table des matières et prévisualisez votre livre entier avant export.",
  },
  {
    href: '/guide/personnages',
    icon: Users,
    title: 'Vos personnages',
    description:
      "Discutez avec vos personnages dans leur voix et laissez l'IA pré-remplir leur fiche à partir du manuscrit.",
  },
  {
    href: '/guide/analyses',
    icon: Microscope,
    title: 'Analyser & vérifier',
    description:
      "Sept analyses de manuscrit pour comprendre votre texte, et la vérification de chapitre pour corriger vos erreurs.",
  },
  {
    href: '/guide/cockpit',
    icon: LayoutDashboard,
    title: 'Le Project Cockpit',
    description:
      "Tableau de bord du projet : tâches, objectifs d'écriture, documents de recherche et suivi des coûts IA.",
  },
  {
    href: '/guide/providers',
    icon: KeyRound,
    title: "Configurer l'IA",
    description:
      "Apportez votre propre clé OpenAI, Anthropic ou Google AI, choisissez votre modèle et suivez vos dépenses.",
  },
  {
    href: '/guide/confidentialite',
    icon: ShieldCheck,
    title: 'Vos données & votre sécurité',
    description:
      "Propriété de vos écrits, chiffrement des clés API, journal IA facultatif, export et suppression de compte.",
  },
];

export default function GuidePage() {
  return (
    <main className="container mx-auto px-4 py-12 md:py-20">
      <div className="mx-auto max-w-4xl">
        {/* Hero */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium text-muted-foreground mb-3">Guide Revise</p>
          <h1 className="text-3xl md:text-5xl font-bold mb-6">
            Tout ce qu&apos;il faut savoir pour écrire avec Revise
          </h1>
          <p className="text-lg text-muted-foreground">
            Revise est un co-auteur, pas un pilote automatique. Ce guide part de ce que vous
            voulez faire — débloquer une scène, réécrire une phrase, comprendre votre texte — et
            vous montre le geste, avant d&apos;expliquer comment ça marche.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/guide/demarrer">
              <Button size="lg">
                Démarrer en 5 minutes
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="lg" variant="outline">
                Créer un compte
              </Button>
            </Link>
          </div>
        </div>

        {/* Grille des catégories */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map(({ href, icon: Icon, title, description }) => (
            <Link key={href} href={href} className="group">
              <Card className="h-full transition-colors hover:border-primary/50">
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="flex items-center gap-2">
                    {title}
                    <ArrowRight className="h-4 w-4 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                  </CardTitle>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>

        {/* Rappel de la philosophie */}
        <Card className="mt-16">
          <CardContent className="space-y-3">
            <h2 className="text-xl font-semibold">Notre promesse, dans chaque fonctionnalité</h2>
            <p className="text-muted-foreground">
              L&apos;IA suggère, vous décidez de ce qui entre dans votre manuscrit. Revise rend les
              fonctions et le contexte IA documentés dans le guide ; vos écrits restent votre
              propriété et le fournisseur configuré traite les demandes qui lui sont envoyées.
              Si une suggestion ne vous convient pas, ignorez-la : vous restez l&apos;auteur.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
