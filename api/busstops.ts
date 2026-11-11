import { Request, Response, Router } from 'express';

const router = Router();

const LTA_BUS_STOPS_ENDPOINT = 'http://datamall2.mytransport.sg/ltaodataservice/BusStops';
const LTA_METADATA_ENDPOINT = 'http://datamall2.mytransport.sg/ltaodataservice/$metadata#BusStops';

// SMU Local Campus Bus Stops Directory
const SMU_SURROUNDING_BUS_STOPS = [
  {
    BusStopCode: '04179',
    RoadName: 'Bras Basah Rd',
    Description: 'SMU / Bras Basah Stn Exit A',
    Latitude: 1.29684,
    Longitude: 103.85042,
    DistanceMetersFromLobby: 75,
    WalkTimeMinutes: 1,
    Sheltered: true,
  },
  {
    BusStopCode: '08069',
    RoadName: 'Bras Basah Rd',
    Description: 'Opp SMU / Hotel Rendezvous',
    Latitude: 1.29821,
    Longitude: 103.85012,
    DistanceMetersFromLobby: 160,
    WalkTimeMinutes: 2,
    Sheltered: true,
  },
  {
    BusStopCode: '04121',
    RoadName: 'Stamford Rd',
    Description: 'SMU / Stamford Rd (Connexion & Law)',
    Latitude: 1.29543,
    Longitude: 103.85018,
    DistanceMetersFromLobby: 55,
    WalkTimeMinutes: 1,
    Sheltered: true,
  },
  {
    BusStopCode: '04029',
    RoadName: 'Bencoolen St',
    Description: 'SMU / Opp Bencoolen Stn Exit B',
    Latitude: 1.29912,
    Longitude: 103.85072,
    DistanceMetersFromLobby: 130,
    WalkTimeMinutes: 1.5,
    Sheltered: true,
  },
  {
    BusStopCode: '07509',
    RoadName: 'Bencoolen St',
    Description: 'Opp SMU / NTUC Income Centre',
    Latitude: 1.29881,
    Longitude: 103.85122,
    DistanceMetersFromLobby: 190,
    WalkTimeMinutes: 2.5,
    Sheltered: false,
  },
  {
    BusStopCode: '04149',
    RoadName: 'Armenian St',
    Description: 'Armenian Ch / Opp SMU Law',
    Latitude: 1.29382,
    Longitude: 103.85091,
    DistanceMetersFromLobby: 220,
    WalkTimeMinutes: 3,
    Sheltered: false,
  },
  {
    BusStopCode: '04111',
    RoadName: 'North Bridge Rd',
    Description: 'Capitol Bldg / City Hall Stn Exit B',
    Latitude: 1.29342,
    Longitude: 103.85172,
    DistanceMetersFromLobby: 310,
    WalkTimeMinutes: 4,
    Sheltered: true,
  },
  {
    BusStopCode: '01012',
    RoadName: 'Victoria St',
    Description: 'Hotel Grand Pacific / Opp SMU',
    Latitude: 1.29742,
    Longitude: 103.85241,
    DistanceMetersFromLobby: 240,
    WalkTimeMinutes: 3,
    Sheltered: false,
  },
];

export async function fetchLTABusStops(skip = 0) {
  const accountKey = process.env.LTA_DATAMALL_API_KEY || process.env.ACCOUNT_KEY || process.env.LTA_ACCOUNT_KEY;

  if (!accountKey || accountKey.trim().length === 0) {
    return {
      'odata.metadata': LTA_METADATA_ENDPOINT,
      value: SMU_SURROUNDING_BUS_STOPS,
      _dataSource: 'smu_campus_directory',
      _note: 'Configure LTA_DATAMALL_API_KEY in .env to query live LTA DataMall stops catalog.',
    };
  }

  const targetUrl = `${LTA_BUS_STOPS_ENDPOINT}?$skip=${skip}`;

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        AccountKey: accountKey.trim(),
        accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`LTA DataMall BusStops responded with status ${response.status}`);
      return {
        'odata.metadata': LTA_METADATA_ENDPOINT,
        value: SMU_SURROUNDING_BUS_STOPS,
        _upstreamError: `LTA responded with HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      'odata.metadata': LTA_METADATA_ENDPOINT,
      ...data,
      _dataSource: 'live_lta_datamall',
    };
  } catch (err: unknown) {
    console.error('Error fetching LTA Bus Stops:', err);
    return {
      'odata.metadata': LTA_METADATA_ENDPOINT,
      value: SMU_SURROUNDING_BUS_STOPS,
    };
  }
}

export async function busStopsHandler(req: Request, res: Response) {
  const skip = parseInt((req.query.$skip as string) || (req.query.skip as string) || '0', 10);
  const smuOnly = req.query.smu !== 'false';

  if (smuOnly) {
    res.json({
      'odata.metadata': LTA_METADATA_ENDPOINT,
      campus: 'Singapore Management University',
      primaryLobby: 'SMU Connexion / Administration Building',
      value: SMU_SURROUNDING_BUS_STOPS,
    });
    return;
  }

  const result = await fetchLTABusStops(skip);
  res.json(result);
}

router.get('/', busStopsHandler);

export default router;
