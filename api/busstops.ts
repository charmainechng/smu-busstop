const LTA_BUS_STOPS_ENDPOINT = 'http://datamall2.mytransport.sg/ltaodataservice/BusStops';
const LTA_METADATA_ENDPOINT = 'http://datamall2.mytransport.sg/ltaodataservice/$metadata#BusStops';

// SMU Main Lobby coordinates (Connexion & Admin Building Hub)
const SMU_LOBBY_LAT = 1.2960;
const SMU_LOBBY_LNG = 103.8505;

// Haversine formula to compute geodesic distance in meters
function computeMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in metres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Walking factor ~ 1.25 for urban pedestrian paths
  return Math.round(R * c * 1.25);
}

// SMU Surrounding Bus Stops Base Directory
const SMU_SURROUNDING_BUS_STOPS = [
  {
    BusStopCode: '04121',
    RoadName: 'Stamford Rd',
    Description: 'SMU / Stamford Rd',
    Latitude: 1.29543,
    Longitude: 103.85018,
    Sheltered: true,
  },
  {
    BusStopCode: '04179',
    RoadName: 'Bras Basah Rd',
    Description: 'SMU / Bras Basah Stn Exit A',
    Latitude: 1.29684,
    Longitude: 103.85042,
    Sheltered: true,
  },
  {
    BusStopCode: '04029',
    RoadName: 'Bencoolen St',
    Description: 'SMU / Opp Bencoolen Stn Exit B',
    Latitude: 1.29912,
    Longitude: 103.85072,
    Sheltered: true,
  },
  {
    BusStopCode: '08069',
    RoadName: 'Bras Basah Rd',
    Description: 'Opp SMU / Hotel Rendezvous',
    Latitude: 1.29821,
    Longitude: 103.85012,
    Sheltered: true,
  },
  {
    BusStopCode: '07509',
    RoadName: 'Bencoolen St',
    Description: 'Opp SMU / NTUC Income Centre',
    Latitude: 1.29881,
    Longitude: 103.85122,
    Sheltered: false,
  },
  {
    BusStopCode: '04149',
    RoadName: 'Armenian St',
    Description: 'Armenian Ch / Opp SMU Law',
    Latitude: 1.29382,
    Longitude: 103.85091,
    Sheltered: false,
  },
  {
    BusStopCode: '04111',
    RoadName: 'North Bridge Rd',
    Description: 'Capitol Bldg / City Hall Stn Exit B',
    Latitude: 1.29342,
    Longitude: 103.85172,
    Sheltered: true,
  },
  {
    BusStopCode: '01012',
    RoadName: 'Victoria St',
    Description: 'Hotel Grand Pacific / Opp SMU',
    Latitude: 1.29742,
    Longitude: 103.85241,
    Sheltered: false,
  },
];

export async function getSMUBusStopsFromLTA() {
  const accountKey = process.env.LTA_DATAMALL_API_KEY || process.env.ACCOUNT_KEY || process.env.LTA_ACCOUNT_KEY;

  let stopsCatalog = SMU_SURROUNDING_BUS_STOPS;

  if (accountKey && accountKey.trim().length > 0) {
    try {
      // Query LTA BusStops endpoint (batch 0 contains stops starting with 01, 04, 07, 08)
      const res = await fetch(`${LTA_BUS_STOPS_ENDPOINT}?$skip=0`, {
        headers: {
          AccountKey: accountKey.trim(),
          accept: 'application/json',
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.value && Array.isArray(data.value)) {
          const ltaStopsMap = new Map();
          data.value.forEach((s: any) => ltaStopsMap.set(s.BusStopCode, s));

          // Enhance stops with live data from LTA
          stopsCatalog = SMU_SURROUNDING_BUS_STOPS.map((s) => {
            const live = ltaStopsMap.get(s.BusStopCode);
            if (live) {
              return {
                ...s,
                RoadName: live.RoadName || s.RoadName,
                Description: live.Description || s.Description,
                Latitude: live.Latitude || s.Latitude,
                Longitude: live.Longitude || s.Longitude,
              };
            }
            return s;
          });
        }
      }
    } catch (err) {
      console.warn('Could not fetch LTA bus stops live catalog:', err);
    }
  }

  // Compute dynamic walking distance & time from SMU Main Lobby
  return stopsCatalog.map((s) => {
    const distMeters = computeMeters(SMU_LOBBY_LAT, SMU_LOBBY_LNG, s.Latitude, s.Longitude);
    const walkMins = Math.max(1, Math.round(distMeters / 75)); // standard walking speed 75m/min
    return {
      BusStopCode: s.BusStopCode,
      RoadName: s.RoadName,
      Description: s.Description,
      Latitude: s.Latitude,
      Longitude: s.Longitude,
      DistanceMetersFromLobby: distMeters,
      WalkTimeMinutes: walkMins,
      Sheltered: s.Sheltered,
    };
  });
}

// Universal Serverless + Express Handler
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, AccountKey'
  );

  if (req.method === 'OPTIONS') {
    if (typeof res.status === 'function') return res.status(200).end();
    res.writeHead(200);
    return res.end();
  }

  const smuStops = await getSMUBusStopsFromLTA();

  const payload = {
    'odata.metadata': LTA_METADATA_ENDPOINT,
    campus: 'Singapore Management University',
    primaryLobby: 'SMU Connexion / Administration Building',
    originCoordinates: {
      latitude: SMU_LOBBY_LAT,
      longitude: SMU_LOBBY_LNG,
    },
    value: smuStops,
  };

  if (typeof res.json === 'function') {
    return res.status(200).json(payload);
  } else {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(payload));
  }
}
