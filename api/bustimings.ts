import { fetchLTABusArrival } from './bus.js';

// Universal Serverless + Express Handler
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

  // Parse query parameters from req.query or fallback to req.url
  let query = req.query || {};
  if (!query || Object.keys(query).length === 0) {
    try {
      const parsedUrl = new URL(req.url, 'http://localhost');
      query = Object.fromEntries(parsedUrl.searchParams.entries());
    } catch {
      query = {};
    }
  }

  const rawStopCode = query.BusStopCode || query.stop || '04179';
  const busStopCode = Array.isArray(rawStopCode) ? String(rawStopCode[0]) : String(rawStopCode);
  const serviceNo = Array.isArray(query.ServiceNo) ? String(query.ServiceNo[0]) : (query.ServiceNo as string | undefined);
  const rawStops = query.stops || query.stopCodes;
  const stopsQuery = Array.isArray(rawStops) ? String(rawStops[0]) : (rawStops as string | undefined);

  let payload: any;

  if (stopsQuery) {
    const stopList = stopsQuery.split(',').map((s: string) => s.trim()).filter(Boolean);
    const results = await Promise.all(
      stopList.map(async (code: string) => {
        const data = await fetchLTABusArrival(code);
        return {
          busStopCode: code,
          ...data,
        };
      })
    );
    payload = {
      timestamp: new Date().toISOString(),
      stops: results,
    };
  } else {
    payload = await fetchLTABusArrival(busStopCode, serviceNo);
  }

  if (typeof res.json === 'function') {
    return res.status(200).json(payload);
  } else {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(payload));
  }
}
