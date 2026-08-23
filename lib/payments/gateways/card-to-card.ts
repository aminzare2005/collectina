/**
 * Card-to-Card Payment Gateway
 *
 * Manual payment method where user transfers money directly to a bank card.
 * No external API calls - just provides card details and handles the flow.
 */

import type {
  PaymentGateway,
  PaymentRequestInput,
  PaymentRequestResult,
  PaymentVerifyInput,
  PaymentVerifyResult,
} from "./types";

interface CardToCardConfig {
  cardNumber: string;
  holderName: string;
  appUrl: string;
}

export class CardToCardGateway implements PaymentGateway {
  readonly id = "card-to-card";
  readonly name = "کارت به کارت";

  private cardNumber: string;
  private holderName: string;
  private appUrl: string;

  constructor(config: CardToCardConfig) {
    if (!config.cardNumber) {
      throw new Error("Card number is required");
    }
    this.cardNumber = config.cardNumber;
    this.holderName = config.holderName || "";
    this.appUrl = config.appUrl;
  }

  async createRequest(input: PaymentRequestInput): Promise<PaymentRequestResult> {
    // For card-to-card, we redirect to a dedicated page with card details
    // The order should already be created with status 'pending'
    const paymentUrl = `${this.appUrl}/card-to-card/${input.orderId}`;

    return {
      success: true,
      trackId: input.orderId, // Use orderId as trackId for card-to-card
      paymentUrl,
    };
  }

  async verify(_input: PaymentVerifyInput): Promise<PaymentVerifyResult> {
    // Card-to-card verification is manual (admin verifies)
    return {
      success: true,
      verified: false, // Not auto-verified
      message: "پرداخت کارت به کارت نیاز به تأیید دستی دارد",
    };
  }

  getPaymentUrl(trackId: string): string {
    return `${this.appUrl}/card-to-card/${trackId}`;
  }

  /** Get card details for display */
  getCardDetails(): { number: string; holderName: string } {
    return {
      number: this.cardNumber,
      holderName: this.holderName,
    };
  }
}

/**
 * Create a Card-to-Card gateway instance from environment variables
 */
export function createCardToCardGateway(): CardToCardGateway {
  const cardNumber = process.env.CARD_TO_CARD_NUMBER;
  const holderName = process.env.CARD_TO_CARD_HOLDER_NAME || "";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!cardNumber) {
    throw new Error("CARD_TO_CARD_NUMBER environment variable is required");
  }

  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL environment variable is required");
  }

  return new CardToCardGateway({
    cardNumber,
    holderName,
    appUrl,
  });
}
