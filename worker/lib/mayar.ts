import { Bindings } from '../types.js';

// Mayar Headless API client.
//
// Docs: https://docs.mayar.id/api-reference/reqpayment/create
// We create a "single payment request" per order and redirect the customer to
// the returned hosted checkout `link`. Reconciliation happens via the
// `payment.received` webhook (see routes/payments.ts).

const PRODUCTION_BASE = 'https://api.mayar.id';
const SANDBOX_BASE = 'https://api.mayar.club';

const getBaseUrl = (env: Bindings) => {
  // Explicit override wins.
  if (env.MAYAR_API_URL) return env.MAYAR_API_URL.replace(/\/$/, '');
  // Otherwise pick by environment flag (defaults to sandbox to avoid
  // accidentally charging real cards during development).
  return env.MAYAR_ENV === 'production' ? PRODUCTION_BASE : SANDBOX_BASE;
};

const getApiKey = (env: Bindings) => {
  if (!env.MAYAR_API_KEY) {
    throw new Error('MAYAR_API_KEY is required to create Mayar payments.');
  }
  return env.MAYAR_API_KEY;
};

export interface CreatePaymentInput {
  name: string;
  email: string;
  amount: number; // whole IDR rupiah
  mobile?: string;
  description?: string;
  redirectUrl?: string;
  // ISO timestamp; payment link is invalid after this.
  expiredAt?: string;
}

export interface CreatePaymentResult {
  id: string;
  transactionId: string;
  link: string;
}

// Create a single payment request and return the hosted checkout link.
export const createPaymentRequest = async (
  env: Bindings,
  input: CreatePaymentInput,
): Promise<CreatePaymentResult> => {
  const baseUrl = getBaseUrl(env);
  const apiKey = getApiKey(env);

  const response = await fetch(`${baseUrl}/hl/v1/payment/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      name: input.name,
      email: input.email,
      amount: input.amount,
      ...(input.mobile ? { mobile: input.mobile } : {}),
      ...(input.description ? { description: input.description } : {}),
      ...(input.redirectUrl ? { redirectUrl: input.redirectUrl } : {}),
      ...(input.expiredAt ? { expiredAt: input.expiredAt } : {}),
    }),
  });

  const text = await response.text();
  let payload: any = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    // Non-JSON error body; fall through to the error below.
  }

  if (!response.ok || !payload?.data?.link) {
    const message = payload?.messages || `Mayar API error (${response.status})`;
    throw new Error(`Failed to create payment: ${message}`);
  }

  return {
    id: payload.data.id,
    transactionId: payload.data.transactionId || payload.data.transaction_id,
    link: payload.data.link,
  };
};

// Fetch the current status of a single payment request by its request id
// (the `id` returned from createPaymentRequest, stored as orders.payment_id).
// Returns the lowercase status string (e.g. 'paid', 'unpaid') or null if the
// request could not be found / verified.
export const getPaymentStatus = async (
  env: Bindings,
  paymentId: string,
): Promise<string | null> => {
  const baseUrl = getBaseUrl(env);
  const apiKey = getApiKey(env);

  const response = await fetch(`${baseUrl}/hl/v1/payment/${encodeURIComponent(paymentId)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!response.ok) {
    return null;
  }

  const text = await response.text();
  let payload: any = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    return null;
  }

  const status = payload?.data?.status;
  return status ? String(status).toLowerCase() : null;
};
