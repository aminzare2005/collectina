/**
 * Payment Gateway Registry
 *
 * Manages multiple payment gateways and provides a unified interface
 * for payment operations.
 */

import type { PaymentGateway, PaymentRequestInput, PaymentRequestResult, PaymentVerifyInput, PaymentVerifyResult } from "./gateways/types";

export type GatewayId = string;

export interface PaymentGatewayConfig {
  /** Default gateway to use if not specified */
  defaultGateway?: GatewayId;
}

export class PaymentRegistry {
  private gateways: Map<GatewayId, PaymentGateway> = new Map();
  private defaultGatewayId: GatewayId | null = null;

  constructor(config?: PaymentGatewayConfig) {
    this.defaultGatewayId = config?.defaultGateway || null;
  }

  /**
   * Register a payment gateway
   */
  register(gateway: PaymentGateway): void {
    if (this.gateways.has(gateway.id)) {
      throw new Error(`Gateway "${gateway.id}" is already registered`);
    }
    this.gateways.set(gateway.id, gateway);
  }

  /**
   * Get a specific gateway by ID
   */
  getGateway(id: GatewayId): PaymentGateway {
    const gateway = this.gateways.get(id);
    if (!gateway) {
      throw new Error(`Gateway "${id}" not found. Available: ${Array.from(this.gateways.keys()).join(", ")}`);
    }
    return gateway;
  }

  /**
   * Get the default gateway
   */
  getDefaultGateway(): PaymentGateway {
    if (this.defaultGatewayId) {
      return this.getGateway(this.defaultGatewayId);
    }

    // If no default set, return the first registered gateway
    const firstGateway = this.gateways.values().next().value;
    if (!firstGateway) {
      throw new Error("No payment gateways registered");
    }
    return firstGateway;
  }

  /**
   * Create a payment request using the specified gateway (or default)
   */
  async createRequest(
    input: PaymentRequestInput,
    gatewayId?: GatewayId,
  ): Promise<PaymentRequestResult & { gateway: string }> {
    const gateway = gatewayId ? this.getGateway(gatewayId) : this.getDefaultGateway();
    const result = await gateway.createRequest(input);
    return { ...result, gateway: gateway.id };
  }

  /**
   * Verify a payment using the specified gateway (or default)
   */
  async verify(
    input: PaymentVerifyInput,
    gatewayId?: GatewayId,
  ): Promise<PaymentVerifyResult & { gateway: string }> {
    const gateway = gatewayId ? this.getGateway(gatewayId) : this.getDefaultGateway();
    const result = await gateway.verify(input);
    return { ...result, gateway: gateway.id };
  }

  /**
   * Get the payment URL for a track ID
   */
  getPaymentUrl(trackId: string, gatewayId?: GatewayId): string {
    const gateway = gatewayId ? this.getGateway(gatewayId) : this.getDefaultGateway();
    return gateway.getPaymentUrl(trackId);
  }

  /**
   * List all registered gateway IDs
   */
  listGateways(): GatewayId[] {
    return Array.from(this.gateways.keys());
  }

  /**
   * Get available gateways with metadata for UI rendering
   */
  getAvailableGateways(): Array<{ id: string; name: string }> {
    return Array.from(this.gateways.values()).map((g) => ({
      id: g.id,
      name: g.name,
    }));
  }

  /**
   * Check if a gateway is registered
   */
  hasGateway(id: GatewayId): boolean {
    return this.gateways.has(id);
  }
}

// Singleton instance for the application
let registryInstance: PaymentRegistry | null = null;

/**
 * Get or create the global payment registry
 */
export function getPaymentRegistry(): PaymentRegistry {
  if (!registryInstance) {
    registryInstance = new PaymentRegistry();
    initializeGateways(registryInstance);
  }
  return registryInstance;
}

/**
 * Initialize gateways from environment configuration
 */
function initializeGateways(registry: PaymentRegistry): void {
  // Initialize Zibal gateway if configured
  const zibalMerchant = process.env.ZIBAL_MERCHANT_ID;
  if (zibalMerchant) {
    const { createZibalGateway } = require("./gateways/zibal");
    const zibal = createZibalGateway();
    registry.register(zibal);
  }

  // Initialize Card-to-Card gateway if configured
  const cardToCardNumber = process.env.CARD_TO_CARD_NUMBER;
  if (cardToCardNumber) {
    const { createCardToCardGateway } = require("./gateways/card-to-card");
    const cardToCard = createCardToCardGateway();
    registry.register(cardToCard);
  }

  // Future gateways can be added here:
  // if (process.env.PAYPING_MERCHANT_ID) {
  //   const payping = createPayPingGateway();
  //   registry.register(payping);
  // }
}
