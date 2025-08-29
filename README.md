
# COLPA MIA — Netlify Pack (FULL v1.1.1)

Frontend statico + Netlify Functions: Stripe Checkout/Subs, Wallet "Minuti di Vita", Webhook, Cron.
**Carica questo ZIP in Netlify → Deploys → Browse to upload** (consigliato comunque il deploy da Git).

## Env minime (Netlify → Site settings → Build & deploy → Environment variables)
- SITE_URL = https://<tuo-sito>.netlify.app
- STRIPE_SECRET_KEY = sk_test_... (per test) / sk_live_... (live)
- STRIPE_WEBHOOK_SECRET = whsec_... (da Stripe Webhooks)
- ADMIN_EMAILS = tua@email

## Identity
- Site settings → Identity → Enable → Registration: Open.

## Stripe Webhook
- URL: https://<tuo-sito>/.netlify/functions/stripe-webhook
- Eventi: checkout.session.completed, invoice.paid (opz. charge.refunded)

## Test
- Registrati dal sito (Accedi) → wallet 50 min
- Checkout carta di test 4242 4242 4242 4242 → success
- Wallet → earn in pending → cron orario lo posta (o chiama manualmente /functions/loyalty-cron)
