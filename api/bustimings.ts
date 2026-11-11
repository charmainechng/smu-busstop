const LTA_BUS_ARRIVAL_ENDPOINT = 'https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival';

// SMU Bus Stops catalog for accurate fallback if AccountKey is pending or not yet configured
const SMU_STOP_SERVICES_MAP: Record<string, string[]> = {
  '04179': ['7', '14', '16', '36', '106', '111', '147', '174', '857'],
  '08069': ['7', '14', '36', '77', '106', '147', '166', '175'],
  '04121': ['190', '7', '14', '16', '36', '124', '147', '174'],
  '04029': ['64', '65', '131', '139', '147', '166', '857'],
  '07509': ['64', '65', '139', '640'],
  '04149': ['2', '12', '32', '51', '61', '63', '80', '197'],
  '04111': ['124', '166', '174', '190'],
  '01012': ['2', '12', '33', '130', '133', '960'],
};

function generateFallbackLTAArrivals(busStopCode: string, serviceNoFilter?: string) {
  const serviceList = SMU_STOP_SERVICES_MAP[busStopCode] || ['7', '14', '106', '147', '190'];
  const now = Date.now();

  const services = serviceList
    .filter((svc) => !serviceNoFilter || svc === serviceNoFilter)
    .map((svc) => {
      const hash = (busStopCode + svc).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const min1 = Math.max(0, (Math.floor(now / 45000) + hash) % 11);
      const min2 = min1 + 6 + (hash % 7);
      const min3 = min2 + 10 + (hash % 6);

      const loads = ['SEA', 'SDA', 'LSD'] as const;
      const load1 = min1 <= 2 ? loads[(hash + 1) % 3] : 'SEA';
      const type = (hash % 2 === 0) ? 'DD' : 'SD';

      return {
        ServiceNo: svc,
        Operator: ['SBST', 'SMRT', 'TTS', 'GAS'][hash % 4],
        NextBus: {
          OriginCode: '10009',
          DestinationCode: '52009',
          EstimatedArrival: new Date(now + min1 * 60000).toISOString(),
          Latitude: '1.2968',
          Longitude: '103.8504',
          VisitNumber: '1',
          Load: load1,
          Feature: 'WAB',
          Type: type,
        },
        NextBus2: {
          OriginCode: '10009',
          DestinationCode: '52009',
          EstimatedArrival: new Date(now + min2 * 60000).toISOString(),
          Latitude: '1.2968',
          Longitude: '103.8504',
          VisitNumber: '1',
          Load: 'SEA',
          Feature: 'WAB',
          Type: 'DD',
        },
        NextBus3: {
          OriginCode: '10009',
          DestinationCode: '52009',
          EstimatedArrival: new Date(now + min3 * 60000).toISOString(),
          Latitude: '1.2968',
          Longitude: '103.8504',
          VisitNumber: '1',
          Load: 'SEA',
          Feature: 'WAB',
          Type: 'SD',
        },
      };
    });

  return {
    'odata.metadata': 'https://datamall2.mytransport.sg/ltaodataservice/$metadata#BusArrivalv3',
    BusStopCode: busStopCode,
    Services: services,
    _dataSource: 'simulation_pending_account_key',
    _note: 'Configure LTA_DATAMALL_API_KEY in .env to pull directly from live LTA Datamall v3 API.',
  };
}

export async function fetchLTABusArrival(busStopCode: string, serviceNo?: string) {
  const accountKey = process.env.LTA_DATAMALL_API_KEY || process.env.ACCOUNT_KEY || process.env.LTA_ACCOUNT_KEY;

  if (!accountKey || accountKey.trim().length === 0) {
    return generateFallbackLTAArrivals(busStopCode, serviceNo);
  }

  const queryParams = new URLSearchParams({ BusStopCode: busStopCode });
  if (serviceNo) {
    queryParams.append('ServiceNo', serviceNo);
  }

  const targetUrl = `${LTA_BUS_ARRIVAL_ENDPOINT}?${queryParams.toString()}`;

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        AccountKey: accountKey.trim(),
        accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`LTA DataMall API responded with status ${response.status}: ${response.statusText}`);
      const fallback = generateFallbackLTAArrivals(busStopCode, serviceNo);
      return {
        ...fallback,
        _upstreamError: `LTA responded with HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      ...data,
      _dataSource: 'live_lta_datamall_v3',
    };
  } catch (err: unknown) {
    console.error('Error fetching LTA Bus Arrival:', err);
    return generateFallbackLTAArrivals(busStopCode, serviceNo);
  }
}

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

  const busStopCode = (query.BusStopCode as string) || (query.stop as string) || '04179';
  const serviceNo = query.ServiceNo as string | undefined;
  const stopsQuery = (query.stops as string) || (query.stopCodes as string);

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
