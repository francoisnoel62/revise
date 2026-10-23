// ABOUTME: Server component fetching the price swings awaiting validation for the admin pricing page.
// ABOUTME: Renders nothing when none are pending; a failed OpenRouter fetch shows a muted notice, not a crash.

import { listPendingPricingVariationsAction } from '@/app/actions/pricing-admin-actions';
import { PendingVariationsPanel } from './PendingVariationsPanel';

export async function PendingVariationsSection() {
  const result = await listPendingPricingVariationsAction();

  if (!result.success) {
    return (
      <p className="mb-4 text-sm text-muted-foreground">
        Variations à valider indisponibles : {result.error}
      </p>
    );
  }
  if (result.data.length === 0) return null;

  return <PendingVariationsPanel variations={result.data} />;
}
