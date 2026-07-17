import { Hono } from 'hono';
import { getSql } from '../lib/db.js';
import { toErrorResponse, unauthorized } from '../lib/errors.js';
import { getPaymentStatus } from '../lib/mayar.js';

import { AppEnv } from '../types.js';

// Mayar payment webhook handler.
//
// Docs: https://docs.mayar.id/integration/webhook
// Mayar does not sign webhook bodies, so we authenticate the callback with a
// shared secret token embedded in the registered URL:
//   https://<site>/api/payments/webhook/<MAYAR_WEBHOOK_TOKEN>
// Register that exact URL in the Mayar dashboard (Integration -> Webhook).

const payments = new Hono<AppEnv>();

// Health/registration helper: register your webhook URL in the Mayar dashboard
// or via the CLI:  npx -y mayar@latest webhook register <url>
payments.get('/webhook/:token', (c) => {
  const token = c.req.param('token');
  if (!c.env.MAYAR_WEBHOOK_TOKEN || token !== c.env.MAYAR_WEBHOOK_TOKEN) {
    return c.json({ error: 'Invalid webhook token' }, 401);
  }
  return c.json({ ok: true });
});

payments.post('/webhook/:token', async (c) => {
  try {
    const token = c.req.param('token');
    if (!c.env.MAYAR_WEBHOOK_TOKEN || token !== c.env.MAYAR_WEBHOOK_TOKEN) {
      throw unauthorized('Invalid webhook token');
    }

    const body = await c.req.json<any>();
    const event = body?.event;
    const data = body?.data || {};

    // We only act on completed payments. Acknowledge everything else with 200
    // so Mayar does not retry events we intentionally ignore.
    if (event !== 'payment.received') {
      return c.json({ ok: true, ignored: event ?? 'unknown' });
    }

    // Mayar identifies the transaction; match it to the order we stored at
    // creation time. Fall back to the request-payment id if present.
    const transactionId = data.id || data.transactionId || data.transaction_id;
    if (!transactionId) {
      return c.json({ ok: true, ignored: 'missing transaction id' });
    }

    const sql = getSql(c.env);

    // Find the pending order this webhook refers to. We do NOT trust the
    // webhook body alone (Mayar does not sign it), so we look up the order and
    // then verify the payment status directly against the Mayar API before
    // flipping it to paid.
    const [order] = await sql`
      select id, payment_id, payment_transaction_id
      from orders
      where status = 'pending'
        and (
          payment_transaction_id = ${transactionId}
          or payment_id = ${transactionId}
        )
      limit 1
    `;

    if (!order) {
      // Either already processed (idempotent) or unknown transaction.
      return c.json({ ok: true, updated: 0 });
    }

    // Verify with Mayar using the stored payment-request id. This defends
    // against spoofed webhooks: a forged callback cannot flip an order to paid
    // unless Mayar itself reports the payment as paid.
    const verifyId = order.payment_id || order.payment_transaction_id;
    const status = await getPaymentStatus(c.env, verifyId);

    if (status !== 'paid') {
      console.warn(
        `Webhook for order ${order.id} not confirmed paid by Mayar (status=${status}); ignoring.`,
      );
      // Acknowledge so Mayar does not retry indefinitely, but do not mark paid.
      return c.json({ ok: true, updated: 0, verified: false, status });
    }

    // Confirmed paid by Mayar; flip pending -> paid (idempotent).
    const updated = await sql`
      update orders set
        status = 'paid',
        paid_at = now()
      where id = ${order.id}
        and status = 'pending'
      returning id
    `;

    return c.json({ ok: true, updated: updated.length, verified: true });
  } catch (error) {
    return toErrorResponse(c, error);
  }
});

export default payments;
