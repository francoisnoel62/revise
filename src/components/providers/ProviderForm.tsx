'use client';

import * as React from 'react';
import { ProviderType } from '@/domain/entities/Provider';
import { SafeProvider } from '@/app/actions/provider-actions';
import {
  testProviderConnectionAction,
  createProviderAction,
  updateProviderAction,
} from '@/app/actions/provider-actions';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { PROVIDER_NAMES, PROVIDER_DOCS } from '@/application/providers/ProviderCatalog';

export interface ProviderFormProps {
  provider?: SafeProvider;
  onSuccess: () => void;
  onCancel: () => void;
}

/**
 * ProviderForm component - create or edit provider configuration.
 * Handles provider type selection, model selection, API key input, and connection testing.
 */
export function ProviderForm({ provider, onSuccess, onCancel }: ProviderFormProps) {
  const isEditing = !!provider;

  // Form state
  const [name, setName] = React.useState(provider?.name || '');
  const [providerType, setProviderType] = React.useState<ProviderType>(
    provider?.type || 'openai'
  );
  const [apiKey, setApiKey] = React.useState('');
  const [model, setModel] = React.useState(provider?.model || '');

  // UI state
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isTesting, setIsTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Handle provider type change
  const handleProviderTypeChange = (newType: ProviderType) => {
    setProviderType(newType);
    setTestResult(null);
    setError(null);
  };

  // Handle test connection
  const handleTestConnection = async () => {
    if (!apiKey) {
      setError('La clé API est requise pour tester la connexion');
      return;
    }

    setIsTesting(true);
    setError(null);
    setTestResult(null);

    try {
      const result = await testProviderConnectionAction({
        type: providerType,
        apiKey,
        model,
      });

      if (result.success) {
        setTestResult({
          success: result.data.valid,
          message: result.data.message,
        });
      } else {
        setError(result.error);
      }
    } catch {
      setError('Impossible de tester la connexion');
    } finally {
      setIsTesting(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let result;

      if (isEditing) {
        // Update existing provider
        const updates: {
          name?: string;
          apiKey?: string;
          model?: string;
        } = {};

        if (name !== provider.name) {
          updates.name = name;
        }
        if (apiKey) {
          updates.apiKey = apiKey;
        }
        if (model !== provider.model) {
          updates.model = model;
        }

        // Mark as valid if test connection was successful
        result = await updateProviderAction(provider.id, updates, testResult?.success);
      } else {
        // Create new provider
        if (!apiKey) {
          setError('La clé API est requise');
          setIsSubmitting(false);
          return;
        }

        // Mark as valid if test connection was successful
        result = await createProviderAction(
          {
            name,
            type: providerType,
            apiKey,
            model,
          },
          testResult?.success
        );
      }

      if (result.success) {
        onSuccess();
      } else {
        setError(result.error);
      }
    } catch {
      setError('Impossible de sauvegarder le provider');
    } finally {
      setIsSubmitting(false);
    }
  };

  const providerName = PROVIDER_NAMES[providerType];
  const providerDocUrl = PROVIDER_DOCS[providerType];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Provider Name */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Nom du provider
          <span className="text-destructive ml-1">*</span>
        </Label>
        <Input
          id="name"
          placeholder="ex. Ma clé OpenAI, Compte production"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <p className="text-xs text-muted-foreground">
          Un nom pour identifier cette configuration de provider
        </p>
      </div>

      {/* Provider Type (only for new providers) */}
      {!isEditing && (
        <div className="space-y-2">
          <Label htmlFor="provider-type">
            Type de provider
            <span className="text-destructive ml-1">*</span>
          </Label>
          <Select value={providerType} onValueChange={handleProviderTypeChange}>
            <SelectTrigger id="provider-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openai">OpenAI</SelectItem>
              <SelectItem value="anthropic">Anthropic</SelectItem>
              <SelectItem value="google">Google AI</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Besoin d&apos;une clé API ?</span>
            <a
              href={providerDocUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              Obtenir une clé {providerName}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      )}

      {/* Model */}
      <div className="space-y-2">
        <Label htmlFor="model">
          Modèle
          <span className="text-destructive ml-1">*</span>
        </Label>
        <Input
          id="model"
          placeholder="ex : gpt-4o, claude-opus-4-6, gemini-2.0-flash"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          required
        />
      </div>

      {/* API Key */}
      <div className="space-y-2">
        <Label htmlFor="api-key">
          Clé API
          {!isEditing && <span className="text-destructive ml-1">*</span>}
        </Label>
        <PasswordInput
          id="api-key"
          placeholder={isEditing ? 'Laisser vide pour conserver la clé actuelle' : 'sk-...'}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          required={!isEditing}
        />
        {isEditing && (
          <p className="text-xs text-muted-foreground">
            Laisser vide pour conserver votre clé API existante
          </p>
        )}
      </div>

      {/* Test Connection Button */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleTestConnection}
          disabled={!apiKey || isTesting}
        >
          {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Tester la connexion
        </Button>
        {testResult && (
          <div className="flex items-center gap-2 text-sm">
            {testResult.success ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-green-600">{testResult.message}</span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-destructive" />
                <span className="text-destructive">{testResult.message}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? 'Mettre à jour' : 'Créer le provider'}
        </Button>
      </div>
    </form>
  );
}
