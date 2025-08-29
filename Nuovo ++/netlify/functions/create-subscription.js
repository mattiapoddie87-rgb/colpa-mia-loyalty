
import Stripe from 'stripe'
import { asUser } from './_common.js'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const PLAN_PRICE_MAP = {
  plus: process.env.STRIPE_PRICE_PLUS,
  pro: process.env.STRIPE_PRICE_PRO,
  elite: process.env.STRIPE_PRICE_ELITE,
}

export const handler = async (event, context) => {
  if(event.httpMethod !== 'POST') return { statusCode:405, body:'Method' }
  const user = asUser(context)
  if(!user) return { statusCode:401, body:'Auth required' }
  const { plan } = JSON.parse(event.body||'{}')
  const price = PLAN_PRICE_MAP[plan]
  if(!price) return { statusCode:400, body:'Unknown plan' }
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price, quantity:1 }],
    metadata: { user_id: user.sub, plan },
    success_url: (process.env.SITE_URL||'') + '/success.html',
    cancel_url: (process.env.SITE_URL||'') + '/cancel.html'
  })
  return { statusCode:200, headers:{'content-type':'application/json'}, body: JSON.stringify({ url: session.url }) }
}
