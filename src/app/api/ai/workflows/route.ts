import { NextResponse } from 'next/server';

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    resource: 'ai/workflows',
    status: 'ready',
    workflows: [
      'lead_scoring',
      'conversion_prediction',
      'product_recommendation',
      'abandoned_order_analysis',
      'campaign_suggestion',
      'customer_segmentation',
      'creator_copilot',
      'generic',
    ],
  });
}
