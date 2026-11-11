// Shared Bus Data Service for LTA DataMall and SMU Bus Transit
const LTA_BUS_ARRIVAL_ENDPOINT = 'https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival';

export const SMU_STOP_CODES = ['04121', '04179', '04029', '08069', '07509', '04149', '04111', '01012'];

export const SMU_STOP_NAMES = {
  '04121': 'SMU / Stamford Rd',
  '04179': 'SMU / Bras Basah Stn Exit A',
  '04029': 'SMU / Opp Bencoolen Stn Exit B',
  '08069': 'Opp SMU / Hotel Rendezvous',
  '07509': 'Opp SMU / NTUC Income Centre',
  '04149': 'Armenian Ch / Opp SMU Law',
  '04111': 'Capitol Bldg / City Hall Stn Exit B',
  '01012': 'Hotel Grand Pacific / Opp SMU',
};

export const SMU_STOP_SERVICES_MAP = {
  '04121': ['190', '7', '14', '16', '36', '124', '147', '174'],
  '04179': ['7', '14', '16', '36', '106', '111', '147', '174', '857'],
  '04029': ['64', '65', '131', '139', '147', '166', '857'],
  '08069': ['7', '14', '36', '77', '106', '147', '166', '175'],
  '07509': ['64', '65', '139', '640'],
  '04149': ['2', '12', '32', '51', '61', '63', '80', '197'],
  '04111': ['124', '166', '174', '190'],
  '01012': ['2', '12', '33', '130', '133', '960'],
};

export function generateFallbackArrivals(busStopCode, serviceNoFilter) {
  const serviceList = SMU_STOP_SERVICES_MAP[busStopCode] || ['7', '14', '106', '147', '190'];
  const now = Date.now();

  const services = serviceList
    .filter((svc) => !serviceNoFilter || svc === serviceNoFilter)
    .map((svc) => {
      const hash = (busStopCode + svc).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const min1 = Math.max(0, (Math.floor(now / 45000) + hash) % 11);
      const min2 = min1 + 6 + (hash % 7);
      const min3 = min2 + 10 + (hash % 6);

      const loads = ['SEA', 'SDA', 'LSD'];
      const load1 = min1 <= 2 ? loads[(hash + 1) % 3] : 'SEA';
      const type = hash % 2 === 0 ? 'DD' : 'SD';

      return {
        ServiceNo: svc,
        Operator: ['SBST', 'SMRT', 'TTS', 'GAS'][hash % 4],
        NextBus: {
          EstimatedArrival: new Date(now + min1 * 60000).toISOString(),
          Load: load1,
          Feature: 'WAB',
          Type: type,
          durationMins: min1,
        },
        NextBus2: {
          EstimatedArrival: new Date(now + min2 * 60000).toISOString(),
          Load: 'SEA',
          Feature: 'WAB',
          Type: 'DD',
          durationMins: min2,
        },
        NextBus3: {
          EstimatedArrival: new Date(now + min3 * 60000).toISOString(),
          Load: 'SEA',
          Feature: 'WAB',
          Type: 'SD',
          durationMins: min3,
        },
      };
    });

  return {
    'odata.metadata': 'https://datamall2.mytransport.sg/ltaodataservice/$metadata#BusArrivalv3',
    BusStopCode: busStopCode,
    Services: services,
    _dataSource: 'simulation_pending_account_key',
  };
}

export async function fetchLTABusArrival(busStopCode, serviceNo) {
  const accountKey = process.env.LTA_DATAMALL_API_KEY || process.env.ACCOUNT_KEY || process.env.LTA_ACCOUNT_KEY;

  if (!accountKey || accountKey.trim().length === 0) {
    const fallback = generateFallbackArrivals(busStopCode, serviceNo);
    return {
      ...fallback,
      _sourceStatus: {
        ok: false,
        source: 'LTA DataMall',
        status: 401,
        error: 'AccountKey missing in process.env',
      },
    };
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
      const fallback = generateFallbackArrivals(busStopCode, serviceNo);
      return {
        ...fallback,
        _sourceStatus: {
          ok: false,
          source: 'LTA DataMall',
          status: response.status,
          error: `HTTP ${response.status}`,
        },
      };
    }

    const data = await response.json();
    return {
      ...data,
      _dataSource: 'live_lta_datamall_v3',
      _sourceStatus: {
        ok: true,
        source: 'LTA DataMall',
        status: 200,
      },
    };
  } catch (err) {
    const fallback = generateFallbackArrivals(busStopCode, serviceNo);
    return {
      ...fallback,
      _sourceStatus: {
        ok: false,
        source: 'LTA DataMall',
        status: 502,
        error: 'Network failure',
      },
    };
  }
}

// Fetch all board stops readings directly in Node without self-HTTP fetch
export async function fetchAllBoardStops() {
  const now = Date.now();
  let firstError = null;

  const stops = await Promise.all(
    SMU_STOP_CODES.map(async (code) => {
      const result = await fetchLTABusArrival(code);
      if (result._sourceStatus && !result._sourceStatus.ok && !firstError) {
        firstError = result._sourceStatus;
      }

      const services = (result.Services || []).map((s) => {
        const calcMins = (isoTime) => {
          if (!isoTime) return undefined;
          const diff = Math.round((new Date(isoTime).getTime() - now) / 60000);
          return Math.max(0, diff);
        };

        const m1 = s.NextBus?.durationMins ?? calcMins(s.NextBus?.EstimatedArrival) ?? 0;
        const m2 = s.NextBus2?.durationMins ?? calcMins(s.NextBus2?.EstimatedArrival);
        const m3 = s.NextBus3?.durationMins ?? calcMins(s.NextBus3?.EstimatedArrival);

        return {
          serviceNo: s.ServiceNo,
          operator: s.Operator,
          next1Mins: m1,
          next2Mins: m2,
          next3Mins: m3,
        };
      });

      return {
        stopCode: code,
        stopName: SMU_STOP_NAMES[code] || code,
        services,
      };
    })
  );

  return {
    stops,
    sourceError: firstError,
  };
}

// Standard handler for /api/bus
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=20, stale-while-revalidate=40');

  if (req.method === 'OPTIONS') {
    if (typeof res.status === 'function') return res.status(200).end();
    res.writeHead(200);
    return res.end();
  }

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
  const serviceNo = Array.isArray(query.ServiceNo) ? String(query.ServiceNo[0]) : (query.ServiceNo);

  const payload = await fetchLTABusArrival(busStopCode, serviceNo);
  if (typeof res.json === 'function') {
    return res.status(200).json(payload);
  } else {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(payload));
  }
}
