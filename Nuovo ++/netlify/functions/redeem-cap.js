
import { asUser, cfg, readWallet } from './_common.js'
export const handler = async (event, context) => {
  const { tierCaps } = cfg();
  const user = asUser(context);
  if(!user){ return { statusCode:200, headers:{'content-type':'application/json'}, body: JSON.stringify({ cap_percent: tierCaps['bronze'] }) } }
  const w = await readWallet(user.sub);
  const cap = tierCaps[w.tier] || 20;
  return { statusCode:200, headers:{'content-type':'application/json'}, body: JSON.stringify({ cap_percent: cap }) };
}
