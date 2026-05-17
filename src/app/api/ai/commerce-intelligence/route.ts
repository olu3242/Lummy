import { NextResponse } from 'next/server';
import { createAppAIRuntime, normalizeCommerceSignalInput } from '@/lib/ai/runtime';

const workflows = new Set([
  'lead_scoring',
  'conversion_prediction',
  'product_recommendation',
  'abandoned_order_analysis',
  'campaign_suggestion',
  'customer_segmentation',
]);

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json() as Record<string, unknown>;
  const workflow = String(body.workflow || '');
  const input = normalizeCommerceSignalInput(body);

  if (!input.tenantId || !workflows.has(workflow)) {
    return NextResponse.json({ error: 'tenantId and a supported commerce workflow are required' }, { status: 400 });
  }

  const commerce = createAppAIRuntime().commerce;
  const result = await runWorkflow(commerce, workflow, input);
  return NextResponse.json({ result });
}

function runWorkflow(commerce: ReturnType<typeof createAppAIRuntime>['commerce'], workflow: string, input: ReturnType<typeof normalizeCommerceSignalInput>) {
  switch (workflow) {
    case 'lead_scoring':
      return commerce.leadScoring(input);
    case 'conversion_prediction':
      return commerce.conversionPrediction(input);
    case 'product_recommendation':
      return commerce.productRecommendation(input);
    case 'abandoned_order_analysis':
      return commerce.abandonedOrderAnalysis(input);
    case 'campaign_suggestion':
      return commerce.campaignSuggestions(input);
    case 'customer_segmentation':
      return commerce.customerSegmentation(input);
    default:
      throw new Error(`Unsupported AI commerce workflow: ${workflow}`);
  }
}
