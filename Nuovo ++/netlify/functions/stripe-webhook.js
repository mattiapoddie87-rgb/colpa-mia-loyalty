
import Stripe from 'stripe'
import { cfg, readWallet, writeWallet, spendToTier } from './_common.js'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export const handler = async (event, context) => {
  const sig = event.headers['stripe-signature']
  let type='unknown', data
  try{
    const wh = stripe.webhooks.constructEvent(event.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
    type = wh.type
    data = wh.data.object
  }catch(e){
    return { statusCode:400, body:'Bad signature' }
  }

  const { eurPerMin, earn } = cfg();

  if(type === 'checkout.session.completed'){
    const uid = data.metadata && data.metadata.user_id
    if(!uid) return { statusCode:200, body:'no user' }
    const minutesSpent = parseInt(data.metadata.redeem_minutes||'0',10)
    const amountTotal = data.amount_total
    const amountDiscount = (data.total_details && data.total_details.amount_discount) || 0
    const net = Math.max(0, (amountTotal - amountDiscount)/100)

    let w = await readWallet(uid)
    if(minutesSpent>0){
      w.balance = Math.max(0, (w.balance||0) - minutesSpent);
      w.ledger.push({ id: Date.now()+"-spend", type:'redeem', delta: -minutesSpent, status:'posted', created_at:new Date().toISOString() })
    }
    const tier = spendToTier(w.spend12m||0)
    const rate = earn[tier] || earn.bronze
    const earnMinutes = Math.floor(net * rate)
    w.pending = (w.pending||0) + earnMinutes
    w.ledger.push({ id: Date.now()+"-earn", type:'earn', delta: earnMinutes, status:'pending', created_at:new Date().toISOString(), post_after_hours: parseInt(process.env.LOYALTY_HOLD_HOURS||'72',10) })
    w.spend12m = (w.spend12m||0) + net
    await writeWallet(uid, w)
    return { statusCode:200, body:'ok' }
  }

  if(type === 'invoice.paid'){
    const uid = data.customer_details && data.customer_details.email
    const planName = data.lines && data.lines.data[0] && data.lines.data[0].price && data.lines.data[0].price.nickname
    const credit = planName && planName.toLowerCase().includes('elite') ? 3000 : planName && planName.toLowerCase().includes('pro') ? 1000 : 300
    if(uid){
      let w = await readWallet(uid)
      w.balance = (w.balance||0) + credit
      w.ledger.push({ id: Date.now()+"-sub", type:'sub_credit', delta: credit, status:'posted', created_at:new Date().toISOString() })
      await writeWallet(uid, w)
    }
  }

  return { statusCode:200, body:'ok' }
}
