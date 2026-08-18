type ZibalProxyResponse = {
  ok: boolean
  result?: number | null
  trackId?: number | null
  message?: string | null
  zibal?: Record<string, unknown> | null
}

function getProxyConfig() {
  const baseUrl = process.env.ZIBAL_PROXY_URL
  const secret = process.env.ZIBAL_PROXY_SECRET

  if (!baseUrl || !secret) {
    throw new Error("ZIBAL_PROXY_URL and ZIBAL_PROXY_SECRET must be configured")
  }

  return { baseUrl: baseUrl.replace(/\/$/, ""), secret }
}

async function callZibalProxy(
  endpoint: "request" | "verify",
  body: Record<string, unknown>,
): Promise<ZibalProxyResponse> {
  const { baseUrl, secret } = getProxyConfig()

  const response = await fetch(`${baseUrl}/zibal-${endpoint}.php`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Proxy-Secret": secret,
    },
    body: JSON.stringify(body),
  })

  const data = (await response.json()) as ZibalProxyResponse

  if (!response.ok) {
    throw new Error(data.message || `Zibal proxy ${endpoint} failed`)
  }

  return data
}

export async function createZibalPaymentRequest(input: {
  orderId: string
  amountInRials: number
  callbackUrl: string
  description: string
}) {
  return callZibalProxy("request", {
    orderId: input.orderId,
    amount: input.amountInRials,
    callbackUrl: input.callbackUrl,
    description: input.description,
  })
}

export async function verifyZibalPayment(trackId: string) {
  return callZibalProxy("verify", { trackId })
}
