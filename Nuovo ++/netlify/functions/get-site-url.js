
export const handler = async () => {
  return { statusCode:200, headers:{'content-type':'application/json'}, body: JSON.stringify({ site: process.env.SITE_URL || '' }) };
}
