// Universal Serverless Function (Vercel, Netlify, Express, Node HTTP)
export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, AccountKey'
  );

  if (req.method === 'OPTIONS') {
    if (typeof res.status === 'function') {
      return res.status(200).end();
    }
    res.writeHead(200);
    return res.end();
  }

  const apiKey = process.env.LTA_DATAMALL_API_KEY || process.env.ACCOUNT_KEY || process.env.LTA_ACCOUNT_KEY;
  const payload = {
    status: 'ok',
    service: 'smu-lobby-transit-api',
    timestamp: new Date().toISOString(),
    uptimeSeconds: typeof process.uptime === 'function' ? Math.floor(process.uptime()) : 0,
    ltaDataMall: {
      accountKeyConfigured: Boolean(apiKey && apiKey.trim().length > 0),
      endpoints: {
        busArrival: 'https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival',
        busStops: 'http://datamall2.mytransport.sg/ltaodataservice/$metadata#BusStops',
      },
    },
  };

  if (typeof res.json === 'function') {
    return res.status(200).json(payload);
  } else {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(payload));
  }
}
