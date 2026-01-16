// ABOUTME: User registration page.
// ABOUTME: Creates account and shows pending approval message.

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { registerUserAction } from '@/app/actions/auth-actions';

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isPendingApproval, setIsPendingApproval] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate terms acceptance
    if (!acceptTerms) {
      setError('Vous devez accepter les conditions d\'utilisation et la politique de confidentialité');
      return;
    }

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    // Validate password strength
    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setIsLoading(true);

    try {
      const result = await registerUserAction(
        formData.email,
        formData.password,
        formData.name || undefined,
        acceptTerms,
        acceptTerms // Privacy is accepted with the same checkbox
      );

      if (!result.success) {
        setError(result.error);
        return;
      }

      // Show pending approval message
      setRegisteredEmail(formData.email);
      setIsPendingApproval(true);
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show pending approval screen after successful registration
  if (isPendingApproval) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="mx-auto w-full max-w-md space-y-6 p-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <svg
              className="h-8 w-8 text-amber-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Compte en attente de validation</h1>
            <p className="text-muted-foreground">
              Votre compte a bien ete cree avec l&apos;adresse{' '}
              <span className="font-medium text-foreground">{registeredEmail}</span>
            </p>
          </div>
          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">
              Un administrateur doit approuver votre inscription avant que vous
              puissiez vous connecter. Vous recevrez un email une fois votre
              compte active.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Vous avez deja un compte approuve ?{' '}
            <Link href="/auth/signin" className="text-primary hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="mx-auto w-full max-w-md space-y-6 p-6">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Créer un compte</h1>
          <p className="text-muted-foreground">
            Entrez vos informations pour commencer
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nom (optionnel)</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Votre nom"
              value={formData.name}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="vous@exemple.com"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Au moins 8 caractères"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={8}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Confirmez votre mot de passe"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="acceptTerms"
              checked={acceptTerms}
              onCheckedChange={(checked) => setAcceptTerms(checked === true)}
              disabled={isLoading}
              className="mt-1"
            />
            <Label htmlFor="acceptTerms" className="text-sm font-normal leading-relaxed">
              J&apos;accepte les{' '}
              <Link href="/conditions-generales-utilisation" className="text-primary hover:underline" target="_blank">
                Conditions Générales d&apos;Utilisation
              </Link>{' '}
              et la{' '}
              <Link href="/politique-confidentialite" className="text-primary hover:underline" target="_blank">
                Politique de confidentialité
              </Link>
            </Label>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading || !acceptTerms}>
            {isLoading ? 'Création du compte...' : 'Créer un compte'}
          </Button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground">
          Vous avez déjà un compte ?{' '}
          <Link href="/auth/signin" className="text-primary hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
