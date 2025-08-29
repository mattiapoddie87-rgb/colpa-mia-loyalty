
import { getStore } from '@netlify/blobs'

export function asUser(context){
  const idt = context.clientContext && context.clientContext.identity;
  if(!idt || !idt.user){ return null; }
  return idt.user;
}

export function cfg(){
  const eurPerMin = parseFloat(process.env.LOYALTY_CONV_EUR_PER_MIN || '0.02');
  const holdHours = parseInt(process.env.LOYALTY_HOLD_HOURS || '72', 10);
  return {
    eurPerMin,
    holdHours,
    earn: {
      bronze: parseFloat(process.env.LOYALTY_EARN_BRONZE || '1.0'),
      silver: parseFloat(process.env.LOYALTY_EARN_SILVER || '1.5'),
      gold: parseFloat(process.env.LOYALTY_EARN_GOLD || '2.0'),
      black: parseFloat(process.env.LOYALTY_EARN_BLACK || '3.0'),
    },
    tierCaps: { bronze:20, silver:25, gold:30, black:35 }
  };
}

export function spendToTier(spend12m){
  if(spend12m>=700) return 'black';
  if(spend12m>=300) return 'gold';
  if(spend12m>=100) return 'silver';
  return 'bronze';
}

export async function readWallet(userId){
  const store = getStore({ name: 'colpa-mia-wallet' });
  const raw = await store.get(`wallet/${userId}.json`, { type:'json' });
  if(!raw){
    const init = { balance: 50, pending: 0, spend12m: 0, tier: 'bronze', ledger: [{id: Date.now(), type:'welcome', delta:50, status:'posted', created_at:new Date().toISOString()}] };
    await store.set(`wallet/${userId}.json`, JSON.stringify(init), { metadata:{ user: userId }});
    return init;
  }
  return raw;
}

export async function writeWallet(userId, data){
  const store = getStore({ name: 'colpa-mia-wallet' });
  await store.set(`wallet/${userId}.json`, JSON.stringify(data), { metadata:{ user: userId }});
}

export function computeRedeemableMax(wallet, capPercent, priceEUR, eurPerMin){
  const maxByCap = Math.floor((priceEUR * (capPercent/100)) / eurPerMin);
  return Math.max(0, Math.min(wallet.balance||0, maxByCap));
}
