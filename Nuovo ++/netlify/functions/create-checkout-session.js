
import Stripe from 'stripe'
import { asUser, cfg, readWallet, writeWallet, computeRedeemableMax } from './_common.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export const handler = async (event, context) => {
  if(event.httpMethod !== 'POST') return { statusCode:405, body:'Method' }
  const user = asUser(context)
  if(!user) return { statusCode:401, body:'Auth required' }
  const body = JSON.parse(event.body||'{}')
  const { service, price_eur, redeem_minutes } = body
  if(!price_eur) return { statusCode:400, body:'price_eur required' }
  const { eurPerMin } = cfg();
  const wallet = await readWallet(user.sub)
  const capPercent = 35
  const minutes = Math.max(0, Math.min(redeem_minutes||0, computeRedeemableMax(wallet, capPercent, price_eur, eurPerMin)))
  const discountAmount = Math.round(minutes * eurPerMin * 100)

  let couponId
  if(discountAmount > 0){
    const coupon = await stripe.coupons.create({ amount_off: discountAmount, currency: 'eur', duration: 'once', name: `Minuti di Vita (${minutes})` })
    couponId = coupon.id
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    currency: 'eur',
    line_items: [ { quantity: 1, price_data: { currency:'eur', unit_amount: Math.round(price_eur*100), product_data: { name: service } } } ],
    discounts: couponId ? [{ coupon: couponId }] : [],
    metadata: { user_id: user.sub, redeem_minutes: String(minutes), service },
    success_url: (process.env.SITE_URL||'') + '/success.html',
    cancel_url: (process.env.SITE_URL||'') + '/cancel.html'
  })

  return { statusCode:200, headers:{'content-type':'application/json'}, body: JSON.stringify({ url: session.url }) }
}
