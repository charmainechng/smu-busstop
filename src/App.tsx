import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { BusStop, BusArrivalInfo, BusLoad, BusType } from './types/transit';
import { SMU_LOBBIES } from './data/smuBusStops';
import { SignageHeader } from './components/SignageHeader';
import { BusStopCardSinglePage } from './components/BusStopCardSinglePage';
import { CampusMapModal } from './components/CampusMapModal';
import { getServiceDestination } from './utils/busDestinations';
import { Footprints, Umbrella, Loader2, RefreshCw } from 'lucide-react';

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
  const [selectedMobileStopId, setSelectedMobileStopId] = useState<string | null>(null);
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

  // Remove bus stops that do not have any bus services (assumed to be not functioning)
  const functioningStops = busStops.filter((s) => s.services && s.services.length > 0);

  const baseDisplayedStops =
    viewMode === 'core-4'
      ? functioningStops.filter((s) => ['04121', '04179', '04029', '08069'].includes(s.id))
      : functioningStops;

  // On mobile, if a single stop chip is selected, filter to that stop
  const displayedStops = selectedMobileStopId
    ? baseDisplayedStops.filter((s) => s.id === selectedMobileStopId)
    : baseDisplayedStops;

  // Responsive grid layout:
  // - On desktop (lg:), maintains strict zero-scroll lobby layout
  // - On mobile (<lg), provides a responsive column layout with natural touch scrolling
  const getGridClass = (count: number, isCore4: boolean) => {
    if (isCore4 || count <= 4) {
      if (count <= 2) {
        return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-rows-1 gap-3.5 lg:gap-3 w-full lg:h-full lg:overflow-hidden';
      }
      if (count === 3) {
        return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-1 gap-3.5 lg:gap-3 w-full lg:h-full lg:overflow-hidden';
      }
      return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-1 gap-3.5 lg:gap-3 w-full lg:h-full lg:overflow-hidden';
    }
    if (count <= 6) {
      return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2 gap-3.5 lg:gap-2.5 w-full lg:h-full lg:overflow-hidden';
    }
    return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2 gap-3.5 lg:gap-2.5 w-full lg:h-full lg:overflow-hidden';
  };

  const gridClass = getGridClass(displayedStops.length, viewMode === 'core-4');
  const maxRowsPerCard = displayedStops.length <= 4 || viewMode === 'core-4' ? 6 : 4;

  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen w-screen max-w-screen overflow-x-hidden overflow-y-auto lg:overflow-hidden flex flex-col bg-slate-950 text-slate-100 font-sans select-none antialiased pb-20 lg:pb-0">
      
      {/* 1. Header (Responsive for desktop & phone) */}
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
      <div className="px-3 sm:px-4 py-1.5 bg-slate-900/90 border-b border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-300 shrink-0 font-mono gap-1">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="flex items-center gap-1.5 text-amber-300 font-bold truncate">
            <Footprints className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">Origin: SMU Main Lobby</span>
          </span>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="text-emerald-400 hidden sm:flex items-center gap-1">
            <Umbrella className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            Concourse Sheltered
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-[11px] text-slate-400">
          <span className="text-slate-300 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse-subtle" />
            {functioningStops.length} Active Stops
          </span>
          <span className="text-slate-600 hidden md:inline">|</span>
          <span className="text-slate-300 hidden xs:inline">
            {viewMode === 'all-8' ? 'All Operating' : 'Core 4 Closest'}
          </span>
        </div>
      </div>

      {/* 3. Mobile Quick Stop Filter Chips (Horizontal scrollable bar for phone commuters) */}
      {functioningStops.length > 0 && (
        <div className="lg:hidden px-3 py-2 bg-slate-950/95 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => setSelectedMobileStopId(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-colors min-h-[38px] flex items-center shrink-0 ${
              selectedMobileStopId === null
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'bg-slate-900 text-slate-300 border border-slate-800 hover:text-white'
            }`}
          >
            All Stops ({functioningStops.length})
          </button>
          {functioningStops.map((stop) => {
            const isSelected = selectedMobileStopId === stop.id;
            return (
              <button
                key={stop.id}
                onClick={() => setSelectedMobileStopId(isSelected ? null : stop.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-colors min-h-[38px] flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-900 text-slate-300 border border-slate-800 hover:text-white'
                }`}
              >
                <span className={`px-1 py-0.2 rounded text-[10px] font-bold ${
                  isSelected ? 'bg-slate-950 text-amber-400' : 'bg-amber-400/20 text-amber-300'
                }`}>
                  {stop.id}
                </span>
                <span className="truncate max-w-[140px] text-[11px] font-medium">
                  {stop.name}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* 4. MAIN VIEWPORT: Kiosk on Desktop (Zero-scroll) + Touch Friendly on Mobile */}
      <main className="flex-1 min-h-0 p-2.5 sm:p-3 overflow-y-auto lg:overflow-hidden">
        {isLoading ? (
          <div className="h-full min-h-[300px] w-full flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            <span className="font-mono text-sm font-semibold text-center px-4">
              Loading active bus stops and live arrivals from /api/bustimings...
            </span>
          </div>
        ) : displayedStops.length === 0 ? (
          <div className="h-full min-h-[300px] w-full flex flex-col items-center justify-center gap-2 text-slate-400 p-6 text-center">
            <span className="text-base font-bold text-slate-300">No Operating Bus Stops Detected</span>
            <span className="text-xs font-mono text-slate-500">
              All surrounding stops currently have no active bus services.
            </span>
            {selectedMobileStopId && (
              <button
                onClick={() => setSelectedMobileStopId(null)}
                className="mt-3 px-4 py-2 bg-amber-400 text-slate-950 text-xs font-bold rounded-lg"
              >
                Reset to View All Stops
              </button>
            )}
          </div>
        ) : (
          <div className={gridClass}>
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
                  maxRows={selectedMobileStopId ? 10 : maxRowsPerCard}
                  isMobileFocused={Boolean(selectedMobileStopId)}
                />
              );
            })}
          </div>
        )}
      </main>

      {/* 5. Fixed Mobile Bottom Bar (Thumb ergonomics for phone users) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-3 py-2 flex items-center justify-between shadow-2xl safe-area-bottom">
        <button
          onClick={handleManualRefresh}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 text-xs font-mono font-bold min-h-[44px] active:scale-95 transition-transform"
          aria-label="Refresh timings"
        >
          <RefreshCw className={`w-4 h-4 ${refreshSecondsLeft === 0 ? 'animate-spin' : ''}`} />
          <span>Refresh ({refreshSecondsLeft}s)</span>
        </button>

        <div className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-subtle" />
          <span>{functioningStops.length} stops</span>
        </div>

        <button
          onClick={() => setIsMapOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-400 text-slate-950 text-xs font-bold min-h-[44px] active:scale-95 transition-transform shadow-md"
          aria-label="Open campus map"
        >
          <Footprints className="w-4 h-4" />
          <span>Campus Map</span>
        </button>
      </div>

      {/* 6. Concourse & Bus Stop Schematic Modal */}
      <CampusMapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        currentLobby={SMU_MAIN_LOBBY}
        busStops={busStops}
      />

    </div>
  );
}
