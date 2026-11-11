import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { BusStop, BusArrivalInfo, BusLoad, BusType } from './types/transit';
import { SMU_LOBBIES } from './data/smuBusStops';
import { SignageHeader } from './components/SignageHeader';
import { BusStopCardSinglePage } from './components/BusStopCardSinglePage';
import { CampusMapModal } from './components/CampusMapModal';
import { getServiceDestination } from './utils/busDestinations';
import { Footprints, Umbrella, Loader2 } from 'lucide-react';

const REFRESH_INTERVAL_SECONDS = 15;
const SMU_MAIN_LOBBY = SMU_LOBBIES[0]; // SMU Connexion & Administration Building Main Lobby

export default function App() {
  const [busStops, setBusStops] = useState<BusStop[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'all-8' | 'core-4'>('all-8');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [refreshSecondsLeft, setRefreshSecondsLeft] = useState<number>(REFRESH_INTERVAL_SECONDS);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState<boolean>(true);
  const [isMapOpen, setIsMapOpen] = useState<boolean>(false);
  const [isLtaConfigured, setIsLtaConfigured] = useState<boolean>(false);
  const [ltaSource, setLtaSource] = useState<string>('lta_api');
  const [, startTransition] = useTransition();

  // Helper to convert LTA DataMall Service to BusArrivalInfo
  const transformServiceFromAPI = (apiSvc: any, stopCode: string): BusArrivalInfo => {
    const now = Date.now();
    const calcMins = (isoTime?: string) => {
      if (!isoTime) return undefined;
      const arrivalTime = new Date(isoTime).getTime();
      return Math.max(0, Math.round((arrivalTime - now) / 60000));
    };

    const next1Mins = calcMins(apiSvc.NextBus?.EstimatedArrival) ?? 0;
    const next2Mins = calcMins(apiSvc.NextBus2?.EstimatedArrival);
    const next3Mins = calcMins(apiSvc.NextBus3?.EstimatedArrival);

    return {
      serviceNo: apiSvc.ServiceNo,
      operator: apiSvc.Operator || 'SBST',
      destination: getServiceDestination(apiSvc.ServiceNo, stopCode, apiSvc.NextBus?.DestinationCode),
      category: 'Trunk',
      nextBus: {
        durationMins: next1Mins,
        load: (apiSvc.NextBus?.Load || 'SEA') as BusLoad,
        feature: (apiSvc.NextBus?.Feature || 'WAB') as 'WAB',
        type: (apiSvc.NextBus?.Type || 'DD') as BusType,
        estimatedTime: apiSvc.NextBus?.EstimatedArrival || '',
      },
      nextBus2: next2Mins !== undefined ? {
        durationMins: next2Mins,
        load: (apiSvc.NextBus2?.Load || 'SEA') as BusLoad,
        feature: (apiSvc.NextBus2?.Feature || 'WAB') as 'WAB',
        type: (apiSvc.NextBus2?.Type || 'DD') as BusType,
        estimatedTime: apiSvc.NextBus2?.EstimatedArrival || '',
      } : undefined,
      nextBus3: next3Mins !== undefined ? {
        durationMins: next3Mins,
        load: (apiSvc.NextBus3?.Load || 'SEA') as BusLoad,
        feature: (apiSvc.NextBus3?.Feature || 'WAB') as 'WAB',
        type: (apiSvc.NextBus3?.Type || 'DD') as BusType,
        estimatedTime: apiSvc.NextBus3?.EstimatedArrival || '',
      } : undefined,
    };
  };

  // Fetch live bus arrival timings from /api/bustimings for current stops
  const fetchLiveTimings = useCallback(async (currentStops: BusStop[]) => {
    if (!currentStops || currentStops.length === 0) return;

    try {
      const stopCodes = currentStops.map((s) => s.id).join(',');
      const res = await fetch(`/api/bustimings?stops=${stopCodes}`);

      if (!res.ok) {
        throw new Error(`Bus timings API responded with ${res.status}`);
      }

      const json = await res.json();
      if (json?.stops && Array.isArray(json.stops)) {
        startTransition(() => {
          setBusStops((prevStops) =>
            prevStops.map((stop) => {
              const apiStopData = json.stops.find((s: any) => s.busStopCode === stop.id);
              if (!apiStopData?.Services || !Array.isArray(apiStopData.Services)) {
                return stop;
              }

              // Build services directly from the API response array
              const liveServices = apiStopData.Services.map((apiSvc: any) =>
                transformServiceFromAPI(apiSvc, stop.id)
              );

              return {
                ...stop,
                services: liveServices,
              };
            })
          );
        });
      }
    } catch (err) {
      console.warn('API timings fetch error:', err);
    }
  }, []);

  // Fetch stops catalog from /api/busstops and then immediately fetch timings
  const loadStopsAndTimings = useCallback(async () => {
    try {
      const stopsRes = await fetch('/api/busstops');
      if (!stopsRes.ok) throw new Error('Failed to load bus stops from /api/busstops');

      const stopsData = await stopsRes.json();
      const rawStops = stopsData.value || [];

      // Transform raw bus stops directly from the API
      const stopsFromAPI: BusStop[] = rawStops.map((s: any) => {
        const dist = s.DistanceMetersFromLobby || 100;
        const walk = s.WalkTimeMinutes || 1;
        return {
          id: s.BusStopCode,
          name: s.Description,
          road: s.RoadName,
          description: s.Description,
          lat: s.Latitude,
          lng: s.Longitude,
          distances: {
            connexion: {
              distanceMeters: dist,
              walkTimeMinutes: walk,
              sheltered: s.Sheltered ?? true,
              routeTip: s.Sheltered ? 'Covered underpass via SMU Concourse' : 'Surface pedestrian street crossing',
            },
          },
          services: [],
        };
      });

      setBusStops(stopsFromAPI);
      setIsLoading(false);

      // Immediately fetch live timings for these stops
      await fetchLiveTimings(stopsFromAPI);
    } catch (err) {
      console.error('Error initializing stops from API:', err);
      setIsLoading(false);
    }
  }, [fetchLiveTimings]);

  // Check /api/health to see if LTA DataMall AccountKey is configured
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data?.ltaDataMall?.accountKeyConfigured) {
          setIsLtaConfigured(true);
          setLtaSource('lta_live');
        }
      })
      .catch((err) => console.warn('Health check note:', err));
  }, []);

  // Initialize on mount
  useEffect(() => {
    loadStopsAndTimings();
  }, [loadStopsAndTimings]);

  // Clock tick (every 1s)
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Self-refreshing countdown loop
  useEffect(() => {
    if (!isAutoRefreshing) return;

    const interval = setInterval(() => {
      setRefreshSecondsLeft((prev) => {
        if (prev <= 1) {
          fetchLiveTimings(busStops);
          return REFRESH_INTERVAL_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isAutoRefreshing, busStops, fetchLiveTimings]);

  const handleManualRefresh = () => {
    fetchLiveTimings(busStops);
    setRefreshSecondsLeft(REFRESH_INTERVAL_SECONDS);
  };

  const displayedStops =
    viewMode === 'core-4'
      ? busStops.filter((s) => ['04121', '04179', '04029', '08069'].includes(s.id))
      : busStops;

  return (
    <div className="h-screen max-h-screen w-screen max-w-screen overflow-hidden flex flex-col bg-slate-950 text-slate-100 font-sans select-none antialiased">
      
      {/* 1. Header */}
      <SignageHeader
        currentTime={currentTime}
        refreshSecondsLeft={refreshSecondsLeft}
        isAutoRefreshing={isAutoRefreshing}
        onManualRefresh={handleManualRefresh}
        onToggleAutoRefresh={() => setIsAutoRefreshing((prev) => !prev)}
        onOpenMap={() => setIsMapOpen(true)}
        ltaSource={ltaSource}
        isLtaConfigured={isLtaConfigured}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
      />

      {/* 2. Status & Origin Reference Strip */}
      <div className="px-4 py-1.5 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-300 shrink-0 font-mono">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-amber-300 font-bold">
            <Footprints className="w-3.5 h-3.5 text-amber-400" />
            Origin: SMU Main Lobby (Connexion &amp; Admin)
          </span>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="text-emerald-400 hidden sm:inline flex items-center gap-1">
            <Umbrella className="w-3.5 h-3.5 text-sky-400" />
            Underground Concourse Available (Rain Sheltered)
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span className="text-slate-300 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse-subtle" />
            Data: Live API ({isLtaConfigured ? 'LTA Production' : 'LTA Service Feed'})
          </span>
          <span className="text-slate-600 hidden md:inline">|</span>
          <span className="text-slate-300">
            {viewMode === 'all-8' ? 'All 8 Surrounding Stops' : 'Core 4 Closest Stops'}
          </span>
        </div>
      </div>

      {/* 3. ZERO-SCROLL MAIN VIEWPORT: Filled with live API bus data */}
      <main className="flex-1 min-h-0 p-2.5 overflow-hidden">
        {isLoading ? (
          <div className="h-full w-full flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            <span className="font-mono text-sm font-semibold">
              Loading bus stops and live arrivals from /api/bustimings...
            </span>
          </div>
        ) : viewMode === 'all-8' ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 grid-rows-2 gap-2.5 h-full w-full overflow-hidden">
            {displayedStops.map((stop) => {
              const distance = stop.distances[SMU_MAIN_LOBBY.id] || {
                distanceMeters: 100,
                walkTimeMinutes: 1,
                sheltered: true,
              };
              return (
                <BusStopCardSinglePage
                  key={stop.id}
                  stop={stop}
                  walkTimeMinutes={distance.walkTimeMinutes}
                  distanceMeters={distance.distanceMeters}
                  sheltered={distance.sheltered}
                  maxRows={4}
                />
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 grid-rows-1 gap-3 h-full w-full overflow-hidden">
            {displayedStops.map((stop) => {
              const distance = stop.distances[SMU_MAIN_LOBBY.id] || {
                distanceMeters: 100,
                walkTimeMinutes: 1,
                sheltered: true,
              };
              return (
                <BusStopCardSinglePage
                  key={stop.id}
                  stop={stop}
                  walkTimeMinutes={distance.walkTimeMinutes}
                  distanceMeters={distance.distanceMeters}
                  sheltered={distance.sheltered}
                  maxRows={7}
                />
              );
            })}
          </div>
        )}
      </main>

      {/* 4. Concourse & Bus Stop Schematic Modal */}
      <CampusMapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        currentLobby={SMU_MAIN_LOBBY}
        busStops={busStops}
      />

    </div>
  );
}
