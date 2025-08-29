
import { asUser, readWallet, writeWallet } from './_common.js'
const ADMINS = (process.env.ADMIN_EMAILS || '').split(',').map(x=>x.trim()).filter(Boolean)

export const handler = async (event, context) => {
  const me = asUser(context)
  if(!me || !ADMINS.includes(me.email)) return { statusCode:403, body:'Forbidden' }
  const { user_id, delta, note } = JSON.parse(event.body||'{}')
  let w = await readWallet(user_id)
  w.balance = (w.balance||0) + (delta||0)
  w.ledger.push({ id: Date.now()+"-admin", type:'admin', delta: delta||0, status:'posted', created_at:new Date().toISOString(), note })
  await writeWallet(user_id, w)
  return { statusCode:200, headers:{'content-type':'application/json'}, body: JSON.stringify({ balance: w.balance }) }
}
