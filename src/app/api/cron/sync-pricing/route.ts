// ABOUTME: Vercel cron route that triggers daily model pricing synchronization from OpenRouter.
// ABOUTME: Protected by CRON_SECRET bearer token; invoked automatically at 06:00 UTC.

import { NextRequest, NextResponse } from 'next/server';
import { SyncModelPricingUseCase } from '@/application/use-cases/SyncModelPricingUseCase';
import { OpenRouterPricingClient } from '@/infrastructure/pricing/OpenRouterPricingClient';
import { getModelPricingRepository, getPendingPriceChangeRepository } from '@/infrastructure/config/providers';
import { ResendEmailService } from '@/infrastructure/email/ResendEmailService';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const pricingRepo = await getModelPricingRepository();
    const pendingPriceChangeRepo = await getPendingPriceChangeRepository();
    const useCase = new SyncModelPricingUseCase(
      new OpenRouterPricingClient(),
      pricingRepo,
      new ResendEmailService(),
      pendingPriceChangeRepo
    );
    const report = await useCase.execute();
    return NextResponse.json({ success: true, report });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
