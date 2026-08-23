/**
 * Payment Gateway Interface
 *
 * Modular payment system that allows swapping between different
 * Iranian payment gateways (Zibal, PayPing, etc.)
 */

export interface PaymentRequestInput {
  /** Internal order ID */
  orderId: string;
  /** Amount in Toman (will be converted to Rials by gateway if needed) */
  amountInToman: number;
  /** Callback URL for payment result */
  callbackUrl: string;
  /** Optional description for the payment */
  description?: string;
  /** Optional extra metadata */
  metadata?: Record<string, unknown>;
}

export interface PaymentRequestResult {
  /** Whether the request was successful */
  success: boolean;
  /** Gateway-specific track ID for the transaction */
  trackId?: string;
  /** URL to redirect user to for payment */
  paymentUrl?: string;
  /** Error message if failed */
  message?: string;
}

export interface PaymentVerifyInput {
  /** The track ID returned from the payment request */
  trackId: string;
  /** Whether the gateway indicated success in callback */
  success?: string;
  /** Additional query params from the callback */
  params?: Record<string, string>;
}

export interface PaymentVerifyResult {
  /** Whether verification was successful */
  success: boolean;
  /** Whether the payment was verified (result === 100) */
  verified: boolean;
  /** Gateway-specific message */
  message?: string;
  /** Raw response from gateway */
  raw?: Record<string, unknown>;
}

export interface PaymentGateway {
  /** Unique identifier for this gateway */
  readonly id: string;

  /** Human-readable name */
  readonly name: string;

  /**
   * Create a payment request with the gateway.
   * Returns a track ID and URL to redirect user to.
   */
  createRequest(input: PaymentRequestInput): Promise<PaymentRequestResult>;

  /**
   * Verify a payment after the user returns from the gateway.
   */
  verify(input: PaymentVerifyInput): Promise<PaymentVerifyResult>;

  /**
   * Get the redirect URL for the payment page.
   * Some gateways redirect to their own page, others may need different handling.
   */
  getPaymentUrl(trackId: string): string;
}
