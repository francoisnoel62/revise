'use client';

import * as React from 'react';
import { SafeProvider, validateProviderAction } from '@/app/actions/provider-actions';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardAction,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Trash, CheckCircle, XCircle, RefreshCw, Loader2 } from 'lucide-react';
import { PROVIDER_NAMES } from '@/infrastructure/config/ai-models';

export interface ProviderCardProps {
  provider: SafeProvider;
  onEdit: (provider: SafeProvider) => void;
  onDelete: (provider: SafeProvider) => void;
  onValidated?: (provider: SafeProvider) => void;
}

/**
 * ProviderCard component - displays a single provider with actions.
 * Shows provider name, type, model, validation status, and masked API key.
 */
export function ProviderCard({ provider, onEdit, onDelete, onValidated }: ProviderCardProps) {
  const [isValidating, setIsValidating] = React.useState(false);
  const [validationError, setValidationError] = React.useState<string | null>(null);
  const providerDisplayName = PROVIDER_NAMES[provider.type] || provider.type;

  const handleValidate = async () => {
    setIsValidating(true);
    setValidationError(null);
    try {
      const result = await validateProviderAction(provider.id);
      if (result.success) {
        onValidated?.(result.data);
      } else {
        setValidationError(result.error);
      }
    } catch {
      setValidationError('Impossible de valider le provider');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleValidate} disabled={isValidating}>
                {isValidating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Valider
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(provider)}>
                <Edit className="mr-2 h-4 w-4" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(provider)}
                className="text-red-600"
              >
                <Trash className="mr-2 h-4 w-4" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
        <CardTitle className="flex items-center gap-2">
          {provider.name}
          {provider.isValid ? (
            <Badge variant="default" className="bg-green-600">
              <CheckCircle className="mr-1 h-3 w-3" />
              Valide
            </Badge>
          ) : (
            <Badge variant="destructive">
              <XCircle className="mr-1 h-3 w-3" />
              Invalide
            </Badge>
          )}
        </CardTitle>
        <CardDescription>{providerDisplayName}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Modèle :</span>
            <span className="font-medium">{provider.model}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Clé API :</span>
            <span className="font-mono text-xs">{provider.maskedApiKey}</span>
          </div>
          {provider.lastTested && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dernier test :</span>
              <span className="text-xs">
                {new Date(provider.lastTested).toLocaleDateString('fr-FR')}
              </span>
            </div>
          )}
          {validationError && (
            <div className="text-xs text-destructive mt-2">
              {validationError}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
