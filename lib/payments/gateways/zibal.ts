/**
 * Zibal Payment Gateway
 *
 * Direct integration with Zibal Iranian payment gateway.
 * Docs: https://zibal.ir
 *
 * API Endpoints:
 * - Request: POST https://gateway.zibal.ir/v1/request
 * - Verify: POST https://gateway.zibal.ir/v1/verify
 * - Gateway: https://gateway.zibal.ir/start/{trackId}
 *
 * Result codes:
 * - 100: Success
 * - 101: Already verified
 * - 102: Merchant not found
 * - 103: Invalid amount
 * - 104: Not allowed IP
 * - 105: Not allowed amount
 * - 106: Error / Invalid callback
 * - 201: Already paid
 */

import type {
  PaymentGateway,
  PaymentRequestInput,
  PaymentRequestResult,
  PaymentVerifyInput,
  PaymentVerifyResult,
} from "./types";

interface ZibalConfig {
  merchant: string;
  sandbox?: boolean;
}

const ZIBAL_API_BASE = "https://gateway.zibal.ir/v1";
const ZIBAL_GATEWAY_BASE = "https://gateway.zibal.ir/start";

const ZIBAL_ERROR_MESSAGES: Record<number, string> = {
  100: "تراکنش با موفقیت انجام شد",
  101: "تراکنش قبلاً تأیید شده است",
  102: "مرچنت یافت نشد",
  103: "مبلغ نامعتبر است",
  104: "IP غیرمجاز",
  105: "مبلغ مجاز نیست",
  106: "خطا در callback",
  201: "پرداخت قبلاً انجام شده",
  [-1]: "خطای داخلی",
  [-2]: "خطا در سرویس",
  [-3]: "خطا در احراز هویت",
  [-4]: "خطا در ارتباط",
};

export class ZibalGateway implements PaymentGateway {
  readonly id = "zibal";
  readonly name = "زیبال";

  private merchant: string;
  private sandbox: boolean;

  constructor(config: ZibalConfig) {
    if (!config.merchant) {
      throw new Error("Zibal merchant ID is required");
    }
    this.merchant = config.merchant;
    this.sandbox = config.sandbox ?? false;
  }

  async createRequest(input: PaymentRequestInput): Promise<PaymentRequestResult> {
    const payload = {
      merchant: this.merchant,
      amount: input.amountInToman * 10, // Convert Toman to Rials
      callbackUrl: input.callbackUrl,
      description: input.description || `پرداخت سفارش ${input.orderId}`,
      orderId: input.orderId,
    };

    try {
      const response = await fetch(`${ZIBAL_API_BASE}/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.result === 100 && data.trackId) {
        return {
          success: true,
          trackId: String(data.trackId),
          paymentUrl: this.getPaymentUrl(String(data.trackId)),
        };
      }

      const errorMessage = ZIBAL_ERROR_MESSAGES[data.result as number] || data.message || "خطا در ایجاد درگاه پرداخت";
      return {
        success: false,
        message: errorMessage,
      };
    } catch (error) {
      console.error("Zibal request error:", error);
      return {
        success: false,
        message: "خطا در اتصال به درگاه پرداخت",
      };
    }
  }

  async verify(input: PaymentVerifyInput): Promise<PaymentVerifyResult> {
    const payload = {
      merchant: this.merchant,
      trackId: input.trackId,
    };

    try {
      const response = await fetch(`${ZIBAL_API_BASE}/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      return {
        success: data.result === 100,
        verified: data.result === 100,
        message: ZIBAL_ERROR_MESSAGES[data.result as number] || data.message,
        raw: data,
      };
    } catch (error) {
      console.error("Zibal verify error:", error);
      return {
        success: false,
        verified: false,
        message: "خطا در تأیید پرداخت",
      };
    }
  }

  getPaymentUrl(trackId: string): string {
    return `${ZIBAL_GATEWAY_BASE}/${trackId}`;
  }
}

/**
 * Create a Zibal gateway instance from environment variables
 */
export function createZibalGateway(): ZibalGateway {
  const merchant = process.env.ZIBAL_MERCHANT_ID;
  if (!merchant) {
    throw new Error("ZIBAL_MERCHANT_ID environment variable is required");
  }

  return new ZibalGateway({
    merchant,
    sandbox: process.env.ZIBAL_SANDBOX === "true",
  });
}
