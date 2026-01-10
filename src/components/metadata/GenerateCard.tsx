// ABOUTME: Card component for generating narrative analysis.
// ABOUTME: Shows provider selection dropdown and generation button.

'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { SafeProvider } from '@/app/actions/provider-actions';

interface GenerateCardProps {
  typeKey: string;
  title: string;
  description: string;
  isGenerating: boolean; // Is THIS specific card generating?
  isAnyGenerating: boolean; // Is ANY card generating?
  providers: SafeProvider[];
  defaultProviderId?: string;
  onGenerate: (providerId: string) => void;
}

export function GenerateCard({
  title,
  description,
  isGenerating,
  isAnyGenerating,
  providers,
  defaultProviderId,
  onGenerate,
}: GenerateCardProps) {
  const [selectedProviderId, setSelectedProviderId] = useState<string>(
    defaultProviderId || providers[0]?.id || ''
  );

  const handleGenerate = () => {
    if (selectedProviderId) {
      onGenerate(selectedProviderId);
    }
  };

  return (
    <Card className="border-dashed hover:border-primary transition-colors">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="provider-select">AI Provider</Label>
          <Select
            value={selectedProviderId}
            onValueChange={setSelectedProviderId}
            disabled={isAnyGenerating || providers.length === 0}
          >
            <SelectTrigger id="provider-select">
              <SelectValue placeholder="Sélectionner un provider" />
            </SelectTrigger>
            <SelectContent>
              {providers.map((provider) => (
                <SelectItem key={provider.id} value={provider.id}>
                  {provider.name} ({provider.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          className="w-full"
          onClick={handleGenerate}
          disabled={isAnyGenerating || !selectedProviderId || providers.length === 0}
        >
          {isGenerating ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              Génération en cours...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Générer avec l&apos;IA
            </>
          )}
        </Button>

        {providers.length === 0 && (
          <p className="text-sm text-muted-foreground text-center">
            Aucun provider configuré. Configurez un provider dans les paramètres.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
