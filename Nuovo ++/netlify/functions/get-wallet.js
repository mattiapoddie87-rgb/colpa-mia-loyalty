
import { asUser, cfg, readWallet, writeWallet, spendToTier, computeRedeemableMax } from './_common.js'

export const handler = async (event, context) => {
  const user = asUser(context);
  if(!user){ return { statusCode:401, body:'Auth required' }; }
  let w = await readWallet(user.sub);
  w.tier = spendToTier(w.spend12m||0);
  await writeWallet(user.sub, w);
  const { eurPerMin, tierCaps } = cfg();
  const cap = tierCaps[w.tier] || 20;
  const redeemableMax = computeRedeemableMax(w, cap, 59, eurPerMin);
  return {
    statusCode:200,
    headers:{'content-type':'application/json'},
    body: JSON.stringify({ balance: w.balance, pending: w.pending||0, tier: w.tier, ledger: w.ledger||[], redeemableMax, expiringSoon: [] })
  };
}
