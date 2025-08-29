
import { cfg } from './_common.js'

export const handler = async () => {
  const env = {
    SITE_URL: !!process.env.SITE_URL,
    STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
  };
  const { eurPerMin, holdHours } = cfg();
  return {
    statusCode: 200,
    headers: {'content-type':'application/json'},
    body: JSON.stringify({ ok: env.SITE_URL && env.STRIPE_SECRET_KEY, env, eurPerMin, holdHours })
  };
}
