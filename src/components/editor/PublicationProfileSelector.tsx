// ABOUTME: Controlled selector for the publication profile active in the editor.
// ABOUTME: Presents print-ready and passerelle lenses without owning switch behavior.

'use client';

import type { PublicationProfileId } from '@/domain/value-objects/PublicationProfile';

interface PublicationProfileSelectorProps {
  readonly value: PublicationProfileId;
  readonly onChange: (profileId: PublicationProfileId) => void;
  readonly isSaving: boolean;
}

export function PublicationProfileSelector({
  value,
  onChange,
  isSaving,
}: PublicationProfileSelectorProps) {
  return (
    <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
      <span className="hidden sm:inline">Profil de publication</span>
      <select
        aria-label="Profil de publication"
        className="h-8 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-wait disabled:opacity-60"
        disabled={isSaving}
        onChange={(event) => onChange(event.target.value as PublicationProfileId)}
        value={value}
      >
        <option value="kdp-6x9">KDP 6×9</option>
        <option value="a5">A5 (148×210 mm)</option>
        <option value="passerelle">Passerelle Word / Google Docs</option>
      </select>
      {isSaving && <span role="status">Enregistrement…</span>}
    </label>
  );
}
