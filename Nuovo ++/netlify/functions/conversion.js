
import { cfg } from './_common.js'
export const handler = async () => {
  const { eurPerMin } = cfg();
  return { statusCode:200, headers:{'content-type':'application/json'}, body: JSON.stringify({ eur_per_min: eurPerMin }) };
}
