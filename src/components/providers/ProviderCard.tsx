'use client';

import * as React from 'react';
import {
  SafeProvider,
  SafeAccountBalance,
  validateProviderAction,
} from '@/app/actions/provider-actions';
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
import { MoreVertical, Edit, Trash, CheckCircle, XCircle, RefreshCw, Loader2, ExternalLink } from 'lucide-react';
import { PROVIDER_NAMES } from '@/infrastructure/config/ai-models';

export interface ProviderCardProps {
  provider: SafeProvider;
  balance?: SafeAccountBalance | null;
  isLoadingBalance?: boolean;
  onEdit: (provider: SafeProvider) => void;
  onDelete: (provider: SafeProvider) => void;
  onValidated?: (provider: SafeProvider) => void;
}

/**
 * Formats balance for display.
 */
function formatBalanceDisplay(balance: SafeAccountBalance): string {
  if (!balance.available) {
    return balance.errorMessage || 'Balance unavailable';
  }

  const symbol = balance.currency === 'USD' ? '$' : balance.currency + ' ';
  const usedStr = `${symbol}${balance.used.toFixed(2)}`;

  if (balance.limit !== null) {
    return `${usedStr} / ${symbol}${balance.limit.toFixed(2)}`;
  }

  return usedStr;
}

/**
 * ProviderCard component - displays a single provider with actions.
 * Shows provider name, type, model, validation status, masked API key, and account balance.
 */
export function ProviderCard({
  provider,
  balance,
  isLoadingBalance,
  onEdit,
  onDelete,
  onValidated,
}: ProviderCardProps) {
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
      setValidationError('Failed to validate provider');
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
                Validate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(provider)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(provider)}
                className="text-red-600"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
        <CardTitle className="flex items-center gap-2">
          {provider.name}
          {provider.isValid ? (
            <Badge variant="default" className="bg-green-600">
              <CheckCircle className="mr-1 h-3 w-3" />
              Valid
            </Badge>
          ) : (
            <Badge variant="destructive">
              <XCircle className="mr-1 h-3 w-3" />
              Invalid
            </Badge>
          )}
        </CardTitle>
        <CardDescription>{providerDisplayName}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Model:</span>
            <span className="font-medium">{provider.model}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">API Key:</span>
            <span className="font-mono text-xs">{provider.maskedApiKey}</span>
          </div>
          {provider.lastTested && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Tested:</span>
              <span className="text-xs">
                {new Date(provider.lastTested).toLocaleDateString()}
              </span>
            </div>
          )}

          {/* Balance section */}
          <div className="flex justify-between items-start">
            <span className="text-muted-foreground">Balance:</span>
            {isLoadingBalance ? (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            ) : balance ? (
              <div className="text-right">
                {balance.available ? (
                  <>
                    <span className="font-medium">{formatBalanceDisplay(balance)}</span>
                    {balance.renewalDate && (
                      <div className="text-xs text-muted-foreground">
                        Renews: {new Date(balance.renewalDate).toLocaleDateString()}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    {balance.errorMessage?.includes('Admin API key') ? (
                      <a
                        href={
                          balance.errorMessage?.includes('platform.openai.com')
                            ? 'https://platform.openai.com/settings/organization/admin-keys'
                            : 'https://console.anthropic.com/settings/admin-keys'
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        Admin key required
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      balance.errorMessage || 'Unavailable'
                    )}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">—</span>
            )}
          </div>

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
