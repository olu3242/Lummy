import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { createPendingOrder } from "@/repositories/order-repository";
import { createPaymentSession } from "../../../../../packages/payments-core/src/orchestrator";
import { resolveProvider } from "../../../../../packages/payments-core/src/provider-router";
import { getRuntimeAppUrl, validateProviderRuntimeEnv, validatePublicRuntimeEnv } from "@/lib/runtime-config";
import { createPaymentDatabaseAdapter } from "@/lib/payments/payment-db-adapter";
import { errorResponse, getCorrelationId, logApiEvent } from "@/lib/ops-observability";

const initiatePaymentSchema = z.object({
  productId: z.string().uuid(),
  email: z.string().email(),
  quantity: z.coerce.number().int().min(1).max(100).default(1),
  method: z.string().optional(),
  provider: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const correlationId = getCorrelationId(request);

  try {
    validatePublicRuntimeEnv();
    const parsed = initiatePaymentSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten(), correlationId },
        { status: 400, headers: { "x-correlation-id": correlationId } },
      );
    }

    const { productId, email, quantity } = parsed.data;
    const resolvedProvider = resolveProvider(parsed.data.provider || parsed.data.method || "paystack").name;
    if (resolvedProvider !== "stripe" && resolvedProvider !== "paystack") {
      return errorResponse(400, "UNSUPPORTED_PAYMENT_PROVIDER", "Unsupported payment provider", correlationId);
    }
    const provider: "stripe" | "paystack" = resolvedProvider;
    validateProviderRuntimeEnv(provider);

    const supabase = createAdminClient();
    const product = await supabase
      .from("products")
      .select("id,title,price,currency,status,organization_id")
      .eq("id", productId)
      .maybeSingle();

    if (product.error || !product.data || product.data.status !== "active") {
      return errorResponse(404, "PRODUCT_UNAVAILABLE", "Product unavailable", correlationId);
    }

    const storefront = await supabase
      .from("storefronts")
      .select("handle,is_active")
      .eq("organization_id", product.data.organization_id)
      .maybeSingle();

    if (storefront.error || !storefront.data?.is_active) {
      return errorResponse(404, "STOREFRONT_UNAVAILABLE", "Storefront unavailable", correlationId);
    }

    const created = await createPendingOrder(
      {
        organizationId: product.data.organization_id,
        productId,
        customerEmail: email,
        quantity,
        provider,
      },
      supabase,
    );

    const appUrl = getRuntimeAppUrl(request.url);
    const successUrl = `${appUrl}/track/${created.order.id}?status=success`;
    const cancelUrl = `${appUrl}/track/${created.order.id}?status=cancelled`;
    const metadata = {
      orderId: created.order.id,
      paymentId: created.payment.id,
      organizationId: product.data.organization_id,
      productId,
      quantity: String(created.quantity),
    };

    const session = await createPaymentSession(
      createPaymentDatabaseAdapter(supabase as never),
      provider,
      {
        amount: Number(created.order.amount),
        currency: created.order.currency,
        customerEmail: created.order.customer_email,
        metadata,
        successUrl,
        cancelUrl,
      },
      correlationId,
    );

    if (session.providerReference) {
      await supabase.from("payments").update({ provider_reference: session.providerReference }).eq("id", created.payment.id);
    }

    logApiEvent("info", "payments.initiate.session_created", {
      correlationId,
      orderId: created.order.id,
      provider,
      storefront: storefront.data.handle,
    });

    return NextResponse.json(
      {
        authorization_url: session.checkoutUrl,
        checkoutUrl: session.checkoutUrl,
        reference: session.providerReference,
        order_id: created.order.id,
        payment_id: created.payment.id,
        correlationId,
      },
      { headers: { "x-correlation-id": correlationId } },
    );
  } catch (error) {
    logApiEvent("error", "payments.initiate.failed", {
      correlationId,
      message: error instanceof Error ? error.message : "Payment initialization failed",
    });
    return errorResponse(400, "PAYMENT_INIT_FAILED", "Payment initialization failed", correlationId);
  }
}
