// ABOUTME: Landing page for Revise Studio - All-in-one writing platform for fiction authors
// ABOUTME: Presents value proposition, features, testimonials, and beta signup CTA

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ContactForm } from '@/components/landing/ContactForm';
import {
  Pen,
  RefreshCw,
  MessageSquare,
  Image,
  BookOpen,
  Lightbulb,
  Map,
  Eye,
  Sparkles,
  Shield,
  Users,
  Zap,
  ChevronRight,
  Moon,
  Maximize2,
  Music,
  Check,
  Quote,
  Heart,
  Mail,
  Bot,
  FileText
} from 'lucide-react';

export const metadata = {
  title: 'Revise Studio - La plateforme d\'écriture pour auteurs de fiction',
  description: 'De l\'idée au livre publié. Idéation, rédaction, correction, édition, publication. Le studio tout-en-un pour les auteurs de fiction.',
};

// Feature card component
function FeatureCard({
  icon: Icon,
  title,
  description,
  available = true
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  available?: boolean;
}) {
  return (
    <Card className={`relative ${!available ? 'opacity-75' : ''}`}>
      {!available && (
        <div className="absolute top-3 right-3">
          <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
            Bientôt
          </span>
        </div>
      )}
      <CardHeader>
        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardContent>
    </Card>
  );
}

// Testimonial card component
function TestimonialCard({
  quote,
  author,
  role
}: {
  quote: string;
  author: string;
  role: string;
}) {
  return (
    <Card className="bg-muted/50">
      <CardContent className="pt-6">
        <Quote className="h-8 w-8 text-primary/30 mb-4" />
        <p className="text-lg mb-6 italic">&ldquo;{quote}&rdquo;</p>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
            <span className="text-primary font-semibold">
              {author.charAt(0)}
            </span>
          </div>
          <div>
            <p className="font-semibold">{author}</p>
            <p className="text-sm text-muted-foreground">{role}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">
            Revise Studio
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/auth/signin">
              <Button variant="ghost">Connexion</Button>
            </Link>
            <Link href="/auth/signup">
              <Button>Demander un accès</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              De l&apos;idée au livre publié.
              <br />
              <span className="text-primary">Tout est dans Revise Studio.</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              La première plateforme d&apos;écriture qui vous accompagne à chaque étape :
              idéation, rédaction, correction, édition, publication.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" className="text-lg px-8 py-6">
                  Commencer à écrire
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                  Découvrir le Studio
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              Accès bêta gratuit. Aucune carte bancaire requise.
            </p>
          </div>
        </div>
      </section>

      {/* Trust indicators */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Pen className="h-5 w-5" />
              <span>Conçu pour la fiction francophone</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <span>Vos manuscrits restent les vôtres</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              <span>Un studio complet, une seule plateforme</span>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Testimonials */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ce qu&apos;en pensent les auteurs
            </h2>
            <p className="text-xl text-muted-foreground">
              Des créatifs qui ont adopté Revise Studio
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            <TestimonialCard
              quote="Les variantes de réécriture m'ont débloquée à chaque fois. Revise comprend qu'écrire, c'est réécrire."
              author="Marie Lefebvre"
              role="Auteure de romans historiques"
            />
            <TestimonialCard
              quote="Revise me propose des directions sans jamais imposer. C'est un vrai compagnon d'écriture, pas un automate."
              author="Thomas Durand"
              role="Scénariste, Prix Jean Vigo"
            />
            <TestimonialCard
              quote="L'analyse narrative repère des incohérences que je n'aurais pas vues avant la 5e relecture. Un gain de temps énorme."
              author="Claire Martin"
              role="Journaliste culturelle"
            />
          </div>
        </div>
      </section>

      {/* Writer's Journey Section */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Le parcours de l&apos;écrivain
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Revise Studio vous accompagne à chaque étape de votre projet
            </p>
          </div>
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-2">
              {/* Step 1 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <h3 className="font-semibold mb-2">Idéation</h3>
                <p className="text-sm text-muted-foreground">
                  Brainstorm, fiches personnages, worldbuilding
                </p>
              </div>
              {/* Arrow */}
              <div className="hidden md:flex items-center justify-center">
                <ChevronRight className="h-6 w-6 text-muted-foreground/50" />
              </div>
              {/* Step 2 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <h3 className="font-semibold mb-2">Rédaction</h3>
                <p className="text-sm text-muted-foreground">
                  Écriture, chapitres, suggestions intelligentes
                </p>
              </div>
              {/* Arrow */}
              <div className="hidden md:flex items-center justify-center">
                <ChevronRight className="h-6 w-6 text-muted-foreground/50" />
              </div>
              {/* Step 3 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <h3 className="font-semibold mb-2">Correction</h3>
                <p className="text-sm text-muted-foreground">
                  Relecture, style, cohérence narrative
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-2 mt-8 md:mt-4">
              {/* Spacer */}
              <div className="hidden md:block" />
              {/* Step 4 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">4</span>
                </div>
                <h3 className="font-semibold mb-2">Édition</h3>
                <p className="text-sm text-muted-foreground">
                  Mise en page, export DOCX/PDF, couverture
                </p>
              </div>
              {/* Arrow */}
              <div className="hidden md:flex items-center justify-center">
                <ChevronRight className="h-6 w-6 text-muted-foreground/50" />
              </div>
              {/* Step 5 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">5</span>
                </div>
                <h3 className="font-semibold mb-2">Publication</h3>
                <p className="text-sm text-muted-foreground">
                  Partage, liens publics, lecteurs bêta
                </p>
              </div>
              {/* Spacer */}
              <div className="hidden md:block" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tous les outils dont vous avez besoin
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Un studio complet pour chaque étape de votre projet d&apos;écriture
            </p>
          </div>

          {/* Available Features */}
          <div className="mb-16">
            <h3 className="text-xl font-semibold mb-8 text-center flex items-center justify-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              Disponible maintenant
            </h3>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
              <FeatureCard
                icon={Pen}
                title="Développement de scènes"
                description="Enrichissez une scène trop courte, améliorez le rythme, ajoutez de la matière narrative tout en préservant votre style."
                available={true}
              />
              <FeatureCard
                icon={RefreshCw}
                title="Réécriture en 3 variantes"
                description="Obtenez 3 propositions stylistiques pour chaque passage : épuré, lyrique, amplifié. Vous choisissez, vous insérez."
                available={true}
              />
              <FeatureCard
                icon={MessageSquare}
                title="Analyse narrative"
                description="Diagnostic complet selon 5 axes : intrigue, personnages, rythme, voix, cohérence. Avec recommandations concrètes."
                available={true}
              />
              <FeatureCard
                icon={Eye}
                title="Descriptions immersives"
                description="Créez des descriptions riches adaptées à votre style et au ton de votre projet."
                available={true}
              />
              <FeatureCard
                icon={Bot}
                title="Chat avec vos personnages"
                description="Interrogez un personnage : il vous répond dans sa voix, selon sa fiche. Explorez sa psychologie, testez une scène, ou débloquez un dialogue difficile. Vous posez les questions. Lui, il reste lui-même."
                available={true}
              />
              <FeatureCard
                icon={FileText}
                title="Fiche personnage depuis le manuscrit"
                description="Un clic sur « Auto-remplir » : l'IA lit vos chapitres et propose une fiche complète — psychologie, voix, histoire, fonction narrative. Vous relisez, vous corrigez, vous enregistrez. Le personnage reste le vôtre."
                available={true}
              />
              <FeatureCard
                icon={BookOpen}
                title="Bible de projet"
                description="Fiches personnages, lieux, relations, événements — extraits automatiquement de votre manuscrit au fil des chapitres. Vous vérifiez, vous validez. La bible se construit pendant que vous écrivez."
                available={true}
              />
              <FeatureCard
                icon={Sparkles}
                title="Suggestions intelligentes"
                description="L'autocomplétion s'appuie sur le texte autour du curseur, les chapitres précédents et les faits du canon pertinents. Vous gardez la main sur chaque insertion."
                available={true}
              />
            </div>
          </div>

          {/* Coming Soon Features */}
          <div>
            <h3 className="text-xl font-semibold mb-8 text-center flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Bientôt disponible
            </h3>
            <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
              <FeatureCard
                icon={Lightbulb}
                title="Brainstorm"
                description="Trouvez des noms, titres, objets, retournements. Pour les moments où l'inspiration manque."
                available={false}
              />
              <FeatureCard
                icon={Map}
                title="Canvas narratif"
                description="Visualisez vos arcs narratifs, vos twists, vos progressions. Une carte de votre histoire."
                available={false}
              />
              <FeatureCard
                icon={Image}
                title="Moodboard"
                description="Illustrations pour vos personnages et votre univers. Donnez un visage à votre imaginaire."
                available={false}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Writing Experience Section */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Votre espace de création
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Un environnement professionnel pensé pour l&apos;écriture longue, pas un simple éditeur de texte.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              {/* Current Features */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600" />
                    Aujourd&apos;hui
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-muted rounded flex items-center justify-center flex-shrink-0">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">Organisation par projets</p>
                      <p className="text-sm text-muted-foreground">
                        Chapitres, scènes, métadonnées. Tout est structuré.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-muted rounded flex items-center justify-center flex-shrink-0">
                      <Pen className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">Éditeur professionnel</p>
                      <p className="text-sm text-muted-foreground">
                        Édition du manuscrit, profils de publication et export DOCX/PDF.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-muted rounded flex items-center justify-center flex-shrink-0">
                      <Zap className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">Sauvegarde automatique</p>
                      <p className="text-sm text-muted-foreground">
                        Vos écrits sont sauvegardés en temps réel.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-muted rounded flex items-center justify-center flex-shrink-0">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">Personnages et canon intégrés</p>
                      <p className="text-sm text-muted-foreground">
                        Vos fiches personnages et les faits canon de votre histoire sont accessibles depuis l&apos;éditeur, toujours à jour.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Coming Soon Features */}
              <Card className="bg-muted/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Bientôt
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-background rounded flex items-center justify-center flex-shrink-0">
                      <Moon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">Thèmes et mode sombre</p>
                      <p className="text-sm text-muted-foreground">
                        Adaptez l&apos;interface à votre confort visuel.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-background rounded flex items-center justify-center flex-shrink-0">
                      <Maximize2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">Mode focus plein écran</p>
                      <p className="text-sm text-muted-foreground">
                        Zéro distraction. Que vous et votre texte.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-background rounded flex items-center justify-center flex-shrink-0">
                      <Music className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">Ambiance sonore</p>
                      <p className="text-sm text-muted-foreground">
                        Musique adaptée au genre et à l&apos;atmosphère de votre projet.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Ownership & Privacy Section */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Vos mots, votre œuvre
              </h2>
              <p className="text-xl text-muted-foreground">
                Respect total de votre travail et de votre vie privée
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              <Card>
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Propriété totale</h3>
                  <p className="text-muted-foreground">
                    Vos textes ne sont jamais utilisés pour quoi que ce soit.
                    Ils vous appartiennent à 100%, point final.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Eye className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Confidentialité absolue</h3>
                  <p className="text-muted-foreground">
                    Accès privé par compte. Vos clés API et, si vous l&apos;activez, le journal des
                    échanges IA sont chiffrés au repos ; les fonctions IA transmettent le contexte
                    nécessaire au fournisseur que vous avez choisi.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Contrôle complet</h3>
                  <p className="text-muted-foreground">
                    Vous décidez ce que vous gardez, modifiez ou supprimez.
                    Revise propose, vous disposez.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Export libre</h3>
                  <p className="text-muted-foreground">
                    Récupérez tout à tout moment en DOCX ou PDF.
                    Aucun verrouillage, aucune dépendance.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Rejoignez le Studio
            </h2>
            <p className="text-xl text-muted-foreground mb-12">
              Accès bêta gratuit
            </p>

            <Card className="border-2 border-primary">
              <CardHeader className="text-center pb-2">
                <div className="inline-block bg-primary text-primary-foreground text-sm px-3 py-1 rounded-full mb-4">
                  Revise Studio
                </div>
                <CardTitle className="text-4xl font-bold">Gratuit</CardTitle>
                <CardDescription className="text-lg">
                  Pendant la bêta, places limitées
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-3 text-left mb-8">
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span>Toutes les fonctionnalités du Studio</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span>Projets illimités</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span>Export DOCX & PDF</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span>Configuration de votre propre fournisseur IA</span>
                  </li>
                </ul>

                <p className="border-t pt-6 mb-6 text-sm text-muted-foreground">
                  Aucun abonnement ni paiement n&apos;est proposé dans la version bêta actuelle.
                </p>

                <Link href="/auth/signup" className="block">
                  <Button size="lg" className="w-full text-lg py-6">
                    Rejoindre la bêta
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Founder Section */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Pourquoi Revise existe
              </h2>
            </div>

            <Card>
              <CardContent className="pt-8 md:pt-12">
                <div className="flex flex-col md:flex-row items-start gap-8">
                  <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mx-auto md:mx-0">
                    <span className="text-4xl font-bold text-primary">FN</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-1 text-center md:text-left">François Fanfan Noël</h3>
                    <p className="text-muted-foreground mb-6 text-center md:text-left">Fondateur</p>

                    <div className="space-y-4 text-muted-foreground">
                      <p className="font-medium text-foreground">
                        Revise est né d&apos;une frustration.
                      </p>

                      <p>
                        Des outils d&apos;écriture qui ne comprennent pas la fiction.
                        Des logiciels pensés pour la productivité, pas pour la créativité.
                        Des fonctions dispersées dans 10 applications différentes.
                      </p>

                      <p>
                        Je voulais un seul endroit pour tout faire : imaginer, écrire,
                        corriger, publier. Un outil qui comprenne que l&apos;écriture
                        de fiction est un travail lent, imparfait, exigeant.
                      </p>

                      <div className="border-l-2 border-primary pl-4 my-6">
                        <p className="font-medium text-foreground mb-2">
                          Ce que je refuse :
                        </p>
                        <p>
                          L&apos;écriture à la chaîne. Les textes standardisés.
                          Les outils qui imposent leur vision. La vitesse qui sacrifie la singularité.
                        </p>
                      </div>

                      <div className="border-l-2 border-primary pl-4 my-6">
                        <p className="font-medium text-foreground mb-2">
                          Ce que je défends :
                        </p>
                        <p>
                          La voix de l&apos;auteur. Le doute créatif. La réécriture comme art.
                          L&apos;imperfection qui rend un texte vivant.
                        </p>
                      </div>

                      <p>
                        Revise ne décide pas à ta place. Il t&apos;aide à aller plus loin
                        dans ce que <span className="italic">toi</span> tu veux dire.
                      </p>

                      <p className="font-medium text-foreground">
                        Mon ambition : offrir aux auteurs francophones un studio d&apos;écriture
                        à la hauteur de leur créativité. Face aux géants anglo-saxons,
                        construire l&apos;outil que nous méritons.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t text-center">
                  <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    Revise Studio recherche des partenaires partageant cette vision de l&apos;écriture francophone
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Prêt à écrire différemment ?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Rejoignez les auteurs qui ont déjà adopté Revise Studio comme compagnon d&apos;écriture.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" className="text-lg px-8 py-6">
                  Rejoindre la bêta
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                  Découvrir le Studio
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 md:py-28 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Contactez-nous
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Une question sur Revise ? Une idée de fonctionnalité ?
              Nous adorons échanger avec nos utilisateurs.
            </p>
          </div>
          <ContactForm />
        </div>
      </section>

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
