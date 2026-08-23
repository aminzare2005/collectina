/**
 * Payment Module
 *
 * Modular payment system for handling multiple Iranian payment gateways.
 */

export { PaymentRegistry, getPaymentRegistry } from "./registry";
export type { GatewayId, PaymentGatewayConfig } from "./registry";

// Re-export types
export type {
  PaymentGateway,
  PaymentRequestInput,
  PaymentRequestResult,
  PaymentVerifyInput,
  PaymentVerifyResult,
} from "./gateways/types";

// Re-export gateway implementations
export { ZibalGateway, createZibalGateway } from "./gateways/zibal";
export { CardToCardGateway, createCardToCardGateway } from "./gateways/card-to-card";
