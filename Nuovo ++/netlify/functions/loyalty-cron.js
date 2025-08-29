
import { getStore } from '@netlify/blobs'

export const handler = async () => {
  const store = getStore({ name: 'colpa-mia-wallet' });
  const list = await store.list({ prefix:'wallet/' })
  let updated = 0
  for(const k of list.blobs){
    const raw = await store.get(k.key, { type:'json' })
    if(!raw) continue
    let changed = false
    const newLedger = []
    for(const item of raw.ledger||[]){
      if(item.status==='pending'){
        const created = new Date(item.created_at)
        const due = new Date(created.getTime() + (parseInt(process.env.LOYALTY_HOLD_HOURS||'72',10)*3600*1000))
        if(due <= new Date()){
          item.status = 'posted';
          raw.balance = (raw.balance||0) + (item.delta||0)
          raw.pending = Math.max(0, (raw.pending||0) - (item.delta||0))
          changed = true
        }
      }
      newLedger.push(item)
    }
    raw.ledger = newLedger
    if(changed){ await store.set(k.key, JSON.stringify(raw)); updated++; }
  }
  return { statusCode:200, body:`updated ${updated}` }
}
