// ABOUTME: User settings page with RGPD data management options
// ABOUTME: Includes account deletion and data export features

'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Trash2, Download, Shield, KeyRound, CheckCircle } from 'lucide-react';
import { deleteAccountAction } from '@/app/actions/auth-actions';
import { exportUserDataAction } from '@/app/actions/user-actions';
import { changePasswordAction } from '@/app/actions/password-actions';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [confirmEmail, setConfirmEmail] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [exportError, setExportError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  // Password change states
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!session?.user) {
    router.push('/auth/signin');
    return null;
  }

  const handleDeleteAccount = async () => {
    if (!confirmEmail) {
      setDeleteError('Veuillez saisir votre email pour confirmer');
      return;
    }

    setIsDeleting(true);
    setDeleteError('');

    try {
      const result = await deleteAccountAction(confirmEmail);

      if (!result.success) {
        setDeleteError(result.error);
        return;
      }

      // Sign out and redirect to home
      await signOut({ redirect: false });
      router.push('/?deleted=true');
    } catch {
      setDeleteError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError('Le nouveau mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    setIsChangingPassword(true);

    try {
      const result = await changePasswordAction(
        passwordData.currentPassword,
        passwordData.newPassword,
        passwordData.confirmPassword
      );

      if (!result.success) {
        setPasswordError(result.error || 'Une erreur est survenue.');
        return;
      }

      setPasswordSuccess(true);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      // Clear success message after 5 seconds
      setTimeout(() => setPasswordSuccess(false), 5000);
    } catch {
      setPasswordError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    setExportError('');

    try {
      const result = await exportUserDataAction();

      if (!result.success) {
        setExportError(result.error);
        return;
      }

      // Download JSON file
      const blob = new Blob([JSON.stringify(result.data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `revise-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setExportError('Une erreur est survenue lors de l\'export.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour
                </Button>
              </Link>
              <h1 className="text-xl font-semibold">Paramètres</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Informations du compte
              </CardTitle>
              <CardDescription>
                Vos informations personnelles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Email</Label>
                <p className="font-medium">{session.user.email}</p>
              </div>
              {session.user.name && (
                <div>
                  <Label className="text-muted-foreground">Nom</Label>
                  <p className="font-medium">{session.user.name}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Security - Password Change */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5" />
                Sécurité
              </CardTitle>
              <CardDescription>
                Modifiez votre mot de passe pour sécuriser votre compte
              </CardDescription>
            </CardHeader>
            <CardContent>
              {passwordSuccess && (
                <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-600 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Mot de passe modifié avec succès. Un email de confirmation vous a été envoyé.
                </div>
              )}

              {passwordError && (
                <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
                  {passwordError}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    placeholder="Votre mot de passe actuel"
                    value={passwordData.currentPassword}
                    onChange={(e) => {
                      setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }));
                      setPasswordError('');
                    }}
                    disabled={isChangingPassword}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Minimum 8 caractères"
                    value={passwordData.newPassword}
                    onChange={(e) => {
                      setPasswordData(prev => ({ ...prev, newPassword: e.target.value }));
                      setPasswordError('');
                    }}
                    disabled={isChangingPassword}
                    minLength={8}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Retapez le nouveau mot de passe"
                    value={passwordData.confirmPassword}
                    onChange={(e) => {
                      setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }));
                      setPasswordError('');
                    }}
                    disabled={isChangingPassword}
                    minLength={8}
                    required
                  />
                </div>

                <Button type="submit" disabled={isChangingPassword}>
                  <KeyRound className="mr-2 h-4 w-4" />
                  {isChangingPassword ? 'Modification...' : 'Modifier le mot de passe'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Data Export */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Exporter mes données
              </CardTitle>
              <CardDescription>
                Téléchargez une copie de toutes vos données (RGPD Article 20 - Droit à la portabilité)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {exportError && (
                <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
                  {exportError}
                </div>
              )}
              <p className="text-sm text-muted-foreground mb-4">
                Le fichier JSON contiendra : votre profil, vos projets, chapitres, métadonnées,
                historique de corrections, et la liste de vos fournisseurs IA (sans les clés API).
              </p>
              <Button
                onClick={handleExportData}
                disabled={isExporting}
                variant="outline"
              >
                <Download className="mr-2 h-4 w-4" />
                {isExporting ? 'Export en cours...' : 'Télécharger mes données'}
              </Button>
            </CardContent>
          </Card>

          {/* Delete Account */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="h-5 w-5" />
                Supprimer mon compte
              </CardTitle>
              <CardDescription>
                Supprimez définitivement votre compte et toutes vos données (RGPD Article 17 - Droit à l&apos;effacement)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 mb-4">
                <p className="text-sm text-red-800">
                  <strong>Attention :</strong> Cette action est irréversible. Toutes vos données seront
                  définitivement supprimées : projets, chapitres, métadonnées, historique de corrections,
                  et configurations de fournisseurs IA.
                </p>
              </div>

              <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer mon compte
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action ne peut pas être annulée. Toutes vos données seront
                      définitivement supprimées de nos serveurs.
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="confirmEmail">
                        Pour confirmer, saisissez votre email : <strong>{session.user.email}</strong>
                      </Label>
                      <Input
                        id="confirmEmail"
                        type="email"
                        placeholder="Votre email"
                        value={confirmEmail}
                        onChange={(e) => {
                          setConfirmEmail(e.target.value);
                          setDeleteError('');
                        }}
                        disabled={isDeleting}
                      />
                    </div>
                    {deleteError && (
                      <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                        {deleteError}
                      </div>
                    )}
                  </div>

                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e) => {
                        e.preventDefault();
                        handleDeleteAccount();
                      }}
                      disabled={isDeleting || confirmEmail.toLowerCase() !== session.user.email?.toLowerCase()}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {isDeleting ? 'Suppression...' : 'Supprimer définitivement'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          {/* Legal Links */}
          <div className="text-center text-sm text-muted-foreground">
            <p>
              En savoir plus sur vos droits :{' '}
              <Link href="/politique-confidentialite" className="text-primary hover:underline">
                Politique de confidentialité
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
