// ABOUTME: Landing page for Revise - AI-powered creative writing tool
// ABOUTME: Presents value proposition, features, testimonials, and beta signup CTA

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  Heart
} from 'lucide-react';

export const metadata = {
  title: 'Revise - L\'assistant IA pour les auteurs de fiction',
  description: 'Le partenaire d\'écriture IA que tout auteur créatif voudrait avoir. Développez vos scènes, réécrivez vos passages, obtenez du feedback constructif.',
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
            Revise
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
              Écrivez votre fiction.
              <br />
              <span className="text-primary">L&apos;IA vous accompagne.</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Le partenaire d&apos;écriture que tout auteur créatif voudrait avoir.
              Pas un remplaçant. Un allié silencieux qui enrichit votre voix.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" className="text-lg px-8 py-6">
                  Demander un accès bêta
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                  Découvrir les fonctionnalités
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              Accès gratuit sur invitation. Aucune carte bancaire requise.
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
              <span>100% fiction française</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <span>Vos textes vous appartiennent</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              <span>Propositions en 3 secondes</span>
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
              Des créatifs qui ont testé Revise en avant-première
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            <TestimonialCard
              quote="Enfin un outil qui comprend qu'écrire, c'est réécrire. Les variantes proposées m'ont débloquée à chaque fois."
              author="Marie Lefebvre"
              role="Auteure de romans historiques"
            />
            <TestimonialCard
              quote="Je cherchais un assistant, pas un automate. Revise me propose des directions sans jamais imposer sa voix."
              author="Thomas Durand"
              role="Scénariste, Prix Jean Vigo"
            />
            <TestimonialCard
              quote="L'analyse narrative est impressionnante. Il repère des incohérences que je n'aurais pas vues avant la 5e relecture."
              author="Claire Martin"
              role="Journaliste culturelle"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-28 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Une boîte à outils narrative complète
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              De l&apos;idée brute au texte final, Revise couvre tout le cycle créatif
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
                title="Scène"
                description="Développe une scène trop courte, améliore le rythme, ajoute de la matière narrative sans changer votre style."
                available={true}
              />
              <FeatureCard
                icon={RefreshCw}
                title="Réécrire"
                description="Réécrit un passage selon vos consignes, avec 3 variantes stylistiques distinctes. Vous choisissez, vous insérez."
                available={true}
              />
              <FeatureCard
                icon={MessageSquare}
                title="Feedback"
                description="Analyse votre texte selon 5 axes narratifs (intrigue, personnages, rythme, voix, cohérence) avec recommandations concrètes."
                available={true}
              />
              <FeatureCard
                icon={Eye}
                title="Describe"
                description="Génère des descriptions immersives adaptées à votre style et au ton de votre projet."
                available={true}
              />
              <FeatureCard
                icon={BookOpen}
                title="Story Bible"
                description="Structurez votre univers : personnages, lieux, chronologie, règles du monde. Tout centralisé."
                available={true}
              />
              <FeatureCard
                icon={Pen}
                title="Write"
                description="Autocomplétion longue (~300 mots) qui écrit dans votre voix, pas celle d'un modèle générique."
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
                description="Idées de noms, titres, objets, retournements. Pour les moments où l'inspiration manque."
                available={false}
              />
              <FeatureCard
                icon={Map}
                title="Canvas"
                description="Visualisez vos arcs narratifs, vos twists, vos progressions. Une carte de votre histoire."
                available={false}
              />
              <FeatureCard
                icon={Image}
                title="Visualize"
                description="Illustrations pour vos personnages et votre worldbuilding. Donnez un visage à votre imaginaire."
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
                Un environnement pensé pour l&apos;écriture
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Pas un chatbot. Un véritable espace de création avec les outils qu&apos;il faut, là où il faut.
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
                        Format A4, typographie avancée, export .docx.
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

      {/* AI & Ethics Section */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Une IA au service de la création
              </h2>
              <p className="text-xl text-muted-foreground">
                Transparence technique et respect de votre travail
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              <Card>
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Génération originale</h3>
                  <p className="text-muted-foreground">
                    Chaque texte est généré mot par mot, de manière unique.
                    Pas de copier-coller de phrases existantes.
                    Pas de plagiat à partir de vos textes.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Vos textes, votre propriété</h3>
                  <p className="text-muted-foreground">
                    Vos écrits ne sont jamais utilisés pour entraîner des modèles.
                    Ils restent privés, chiffrés, et vous appartiennent à 100%.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Choix du fournisseur IA</h3>
                  <p className="text-muted-foreground">
                    Vous choisissez votre modèle : OpenAI, Anthropic, ou d&apos;autres.
                    Revise est l&apos;interface, vous gardez le contrôle technique.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Lightbulb className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Vision future</h3>
                  <p className="text-muted-foreground">
                    Modèles fine-tunés par genre (SF, policier, romance, fantasy).
                    Priorité absolue : la créativité en français.
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
              Commencez à écrire
            </h2>
            <p className="text-xl text-muted-foreground mb-12">
              Accès bêta gratuit, puis abonnement simple et sans engagement
            </p>

            <Card className="border-2 border-primary">
              <CardHeader className="text-center pb-2">
                <div className="inline-block bg-primary text-primary-foreground text-sm px-3 py-1 rounded-full mb-4">
                  Accès bêta
                </div>
                <CardTitle className="text-4xl font-bold">Gratuit</CardTitle>
                <CardDescription className="text-lg">
                  Sur invitation, places limitées
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-3 text-left mb-8">
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span>Toutes les fonctionnalités disponibles</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span>Projets illimités</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span>Support prioritaire</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span>Aucune carte bancaire requise</span>
                  </li>
                </ul>

                <div className="border-t pt-6 mb-6">
                  <p className="text-sm text-muted-foreground mb-2">
                    Après la bêta
                  </p>
                  <p className="text-2xl font-bold">
                    9,90 &euro;<span className="text-base font-normal text-muted-foreground">/mois</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Annulation à tout moment
                  </p>
                </div>

                <Link href="/auth/signup" className="block">
                  <Button size="lg" className="w-full text-lg py-6">
                    Demander un accès bêta
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
                        J&apos;ai passé des heures devant des outils d&apos;IA qui me proposaient
                        des textes lisses, génériques, interchangeables. Des phrases que
                        n&apos;importe qui aurait pu écrire. Des suggestions qui effaçaient
                        ma voix au lieu de l&apos;enrichir.
                      </p>

                      <p>
                        Je voulais autre chose : un outil qui comprenne que l&apos;écriture
                        de fiction est un travail lent, imparfait, exigeant. Pas une course
                        à la production.
                      </p>

                      <div className="border-l-2 border-primary pl-4 my-6">
                        <p className="font-medium text-foreground mb-2">
                          Ce que je refuse :
                        </p>
                        <p>
                          L&apos;écriture jetable. Les textes standardisés. L&apos;IA qui remplace
                          l&apos;auteur. La vitesse qui sacrifie la singularité.
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
                        Revise n&apos;écrit pas à ta place. Il t&apos;aide à aller plus loin
                        dans ce que <span className="italic">toi</span> tu veux dire.
                      </p>

                      <p className="font-medium text-foreground">
                        Mon ambition : offrir aux auteurs francophones un environnement
                        d&apos;écriture à la hauteur de leur créativité. Face aux géants
                        anglo-saxons, construire l&apos;outil que nous méritons.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t text-center">
                  <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    Revise recherche des investisseurs partageant cette vision du storytelling francophone
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
              Rejoignez les auteurs qui ont déjà adopté Revise comme partenaire créatif.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" className="text-lg px-8 py-6">
                  Demander un accès bêta
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                  En savoir plus
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">Revise</span>
              <span className="text-muted-foreground">
                &mdash; L&apos;assistant IA pour les auteurs de fiction
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
            <p>&copy; {new Date().getFullYear()} Revise. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
