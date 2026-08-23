/**
 * @deprecated This file is kept for backward compatibility.
 * Use the new payment gateway system from @/lib/payments instead.
 */

import { getPaymentRegistry } from "./payments";

type ZibalProxyResponse = {
  ok: boolean;
  result?: number | null;
  trackId?: number | null;
  message?: string | null;
  zibal?: Record<string, unknown> | null;
};

/**
 * @deprecated Use getPaymentRegistry().createRequest() instead
 */
export async function createZibalPaymentRequest(input: {
  orderId: string;
  amountInRials: number;
  callbackUrl: string;
  description: string;
}): Promise<ZibalProxyResponse> {
  const registry = getPaymentRegistry();
  const result = await registry.createRequest({
    orderId: input.orderId,
    amountInToman: input.amountInRials / 10, // Convert Rials back to Toman
    callbackUrl: input.callbackUrl,
    description: input.description,
  });

  return {
    ok: result.success,
    result: result.success ? 100 : null,
    trackId: result.trackId ? parseInt(result.trackId, 10) : null,
    message: result.message,
  };
}

/**
 * @deprecated Use getPaymentRegistry().verify() instead
 */
export async function verifyZibalPayment(trackId: string): Promise<ZibalProxyResponse> {
  const registry = getPaymentRegistry();
  const result = await registry.verify({ trackId });

  return {
    ok: result.verified,
    result: result.verified ? 100 : null,
    message: result.message,
  };
}
