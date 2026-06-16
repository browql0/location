import { env } from "../../config/env.js";
import { AppError } from "../../shared/errors/app-error.js";

type PayPalOrderResponse = {
  id?: string;
  status?: string;
  links?: Array<{ href: string; rel: string; method: string }>;
};

type PayPalCaptureResponse = {
  id?: string;
  status?: string;
  purchase_units?: Array<{
    payments?: {
      captures?: Array<{ id?: string; status?: string }>;
    };
  }>;
};

function paypalBaseUrl() {
  return env.PAYPAL_MODE === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

function assertPayPalConfigured() {
  if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET) {
    throw new AppError("PayPal is not configured", 503, "PAYPAL_NOT_CONFIGURED");
  }
}

async function accessToken() {
  assertPayPalConfigured();
  const response = await fetch(`${paypalBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });

  if (!response.ok) throw new AppError("PayPal authentication failed", 502, "PAYPAL_AUTH_FAILED");
  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) throw new AppError("PayPal token missing", 502, "PAYPAL_TOKEN_MISSING");
  return data.access_token;
}

export async function createPayPalOrder(input: { amount: string; paymentId: string; reservationId: string }) {
  const token = await accessToken();
  const response = await fetch(`${paypalBaseUrl()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: input.paymentId,
          custom_id: input.reservationId,
          amount: { currency_code: env.PAYPAL_CURRENCY, value: input.amount }
        }
      ],
      application_context: {
        return_url: env.PAYPAL_RETURN_URL,
        cancel_url: env.PAYPAL_CANCEL_URL,
        user_action: "PAY_NOW"
      }
    })
  });

  const data = (await response.json()) as PayPalOrderResponse;
  if (!response.ok || !data.id) throw new AppError("PayPal order creation failed", 502, "PAYPAL_ORDER_FAILED", data);
  return {
    orderId: data.id,
    status: data.status ?? null,
    approvalUrl: data.links?.find((link) => link.rel === "approve")?.href ?? null,
    raw: data
  };
}

export async function capturePayPalOrder(orderId: string) {
  const token = await accessToken();
  const response = await fetch(`${paypalBaseUrl()}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  const data = (await response.json()) as PayPalCaptureResponse;
  if (!response.ok) throw new AppError("PayPal capture failed", 502, "PAYPAL_CAPTURE_FAILED", data);
  const capture = data.purchase_units?.flatMap((unit) => unit.payments?.captures ?? []).find(Boolean);
  return {
    orderId: data.id ?? orderId,
    status: data.status ?? null,
    captureId: capture?.id ?? null,
    captureStatus: capture?.status ?? null,
    raw: data
  };
}
