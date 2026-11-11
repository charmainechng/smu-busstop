import { Request, Response, Router } from 'express';

const router = Router();

export function getHealthStatus() {
  const apiKey = process.env.LTA_DATAMALL_API_KEY || process.env.ACCOUNT_KEY || process.env.LTA_ACCOUNT_KEY;
  return {
    status: 'ok',
    service: 'smu-lobby-transit-api',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    ltaDataMall: {
      accountKeyConfigured: Boolean(apiKey && apiKey.trim().length > 0),
      endpoints: {
        busArrival: 'https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival',
        busStops: 'http://datamall2.mytransport.sg/ltaodataservice/$metadata#BusStops',
      },
    },
  };
}

export async function healthHandler(req: Request, res: Response) {
  const health = getHealthStatus();
  res.json(health);
}

router.get('/', healthHandler);

export default router;
