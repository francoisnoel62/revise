// ABOUTME: Admin form dialog for editing a model pricing entry manually.
// ABOUTME: Allows updating USD/M token rates and the cachedInInput flag.

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { updateModelPricingAction } from '@/app/actions/pricing-admin-actions';
import type { ModelPricingEntry } from '@/domain/interfaces/ModelPricingRepository';

interface Props {
  entry: ModelPricingEntry;
  onClose: () => void;
  onSaved: () => void;
}

export function ModelPricingForm({ entry, onClose, onSaved }: Props) {
  const [inputPerM, setInputPerM] = useState(String(entry.inputPerM));
  const [outputPerM, setOutputPerM] = useState(String(entry.outputPerM));
  const [cachedInputPerM, setCachedInputPerM] = useState(String(entry.cachedInputPerM));
  const [cachedInInput, setCachedInInput] = useState(entry.cachedInInput);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const result = await updateModelPricingAction(entry.id, {
      inputPerM: parseFloat(inputPerM),
      outputPerM: parseFloat(outputPerM),
      cachedInputPerM: parseFloat(cachedInputPerM),
      cachedInInput,
    });
    setSaving(false);
    if (result.success) {
      onSaved();
    } else {
      setError(result.error);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier le tarif — {entry.prefix}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-3 items-center gap-4">
            <Label className="text-right">Provider</Label>
            <span className="col-span-2 text-sm font-mono">{entry.provider}</span>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <Label className="text-right">Prefix</Label>
            <span className="col-span-2 text-sm font-mono">{entry.prefix}</span>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor="inputPerM" className="text-right">Input / M (USD)</Label>
            <Input
              id="inputPerM"
              type="number"
              step="0.001"
              min="0"
              value={inputPerM}
              onChange={(e) => setInputPerM(e.target.value)}
              className="col-span-2"
            />
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor="outputPerM" className="text-right">Output / M (USD)</Label>
            <Input
              id="outputPerM"
              type="number"
              step="0.001"
              min="0"
              value={outputPerM}
              onChange={(e) => setOutputPerM(e.target.value)}
              className="col-span-2"
            />
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor="cachedInputPerM" className="text-right">Cache / M (USD)</Label>
            <Input
              id="cachedInputPerM"
              type="number"
              step="0.0001"
              min="0"
              value={cachedInputPerM}
              onChange={(e) => setCachedInputPerM(e.target.value)}
              className="col-span-2"
            />
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor="cachedInInput" className="text-right">Cache dans input</Label>
            <Switch
              id="cachedInInput"
              checked={cachedInInput}
              onCheckedChange={setCachedInInput}
            />
          </div>
          {error && <p className="text-sm text-destructive col-span-3">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Annuler</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
