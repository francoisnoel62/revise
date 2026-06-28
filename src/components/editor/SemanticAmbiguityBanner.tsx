// ABOUTME: Banner shown when a chapter contains ambiguous nodes after semantic migration.
// ABOUTME: Lists each node needing manual reclassification and provides a dismiss action.

import React from 'react';
import type { MigrationAmbiguity } from '@/application/migration/ContentMigrator';

interface SemanticAmbiguityBannerProps {
  ambiguities: MigrationAmbiguity[];
  onDismiss: () => void;
}

export function SemanticAmbiguityBanner({ ambiguities, onDismiss }: SemanticAmbiguityBannerProps) {
  if (ambiguities.length === 0) return null;

  return (
    <div
      role="alert"
      className="mb-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="font-medium">
            {ambiguities.length} bloc{ambiguities.length > 1 ? 's' : ''} à reclassifier
          </p>
          <ul className="mt-1 space-y-0.5 text-amber-800">
            {ambiguities.map((a) => (
              <li key={a.nodeIndex} className="text-xs">
                {a.reason}
              </li>
            ))}
          </ul>
        </div>
        <button
          onClick={onDismiss}
          className="shrink-0 rounded px-2 py-0.5 text-xs font-medium hover:bg-amber-100"
          aria-label="Fermer"
        >
          Compris
        </button>
      </div>
    </div>
  );
}
