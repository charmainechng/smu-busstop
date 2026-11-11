import React, { useState, useEffect, useCallback } from 'react';
import { BusStop, BusArrivalInfo, BusLoad, BusType } from './types/transit';
import { INITIAL_BUS_STOPS, SMU_LOBBIES } from './data/smuBusStops';
import { simulateUpdatedStops } from './utils/transitEngine';
import { SignageHeader } from './components/SignageHeader';
import { BusStopCardSinglePage } from './components/BusStopCardSinglePage';
import { CampusMapModal } from './components/CampusMapModal';
import { Footprints, Umbrella, Radio } from 'lucide-react';

const REFRESH_INTERVAL_SECONDS = 15;
const SMU_MAIN_LOBBY = SMU_LOBBIES[0]; // SMU Connexion & Administration Building Main Lobby

export default function App() {
  const [busStops, setBusStops] = useState<BusStop[]>(INITIAL_BUS_STOPS);
  const [viewMode, setViewMode] = useState<'all-8' | 'core-4'>('all-8');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [refreshSecondsLeft, setRefreshSecondsLeft] = useState<number>(REFRESH_INTERVAL_SECONDS);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState<boolean>(true);
  const [isMapOpen, setIsMapOpen] = useState<boolean>(false);
  const [isLtaConfigured, setIsLtaConfigured] = useState<boolean>(false);
  const [ltaSource, setLtaSource] = useState<string>('simulation_pending_account_key');

  // Check /api/health to see if LTA DataMall AccountKey is configured
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data?.ltaDataMall?.accountKeyConfigured) {
          setIsLtaConfigured(true);
        }
      })
      .catch((err) => console.warn('Health check note:', err));
  }, []);

  // Fetch live bus timings from /api/bustimings
  const fetchLiveTimings = useCallback(async () => {
    try {
      const stopCodes = INITIAL_BUS_STOPS.map((s) => s.id).join(',');
      const res = await fetch(`/api/bustimings?stops=${stopCodes}`);
      
      if (!res.ok) {
        throw new Error(`API responded with ${res.status}`);
      }

      const json = await res.json();
      if (json?.stops && Array.isArray(json.stops)) {
        setBusStops((prevStops) => {
          return prevStops.map((stop) => {
            const apiStopData = json.stops.find((s: { busStopCode: string }) => s.busStopCode === stop.id);
            if (!apiStopData?.Services || !Array.isArray(apiStopData.Services)) {
              return stop;
            }

            const updatedServices: BusArrivalInfo[] = stop.services.map((svc) => {
              const apiSvc = apiStopData.Services.find(
                (s: { ServiceNo: string }) => s.ServiceNo === svc.serviceNo
              );

              if (!apiSvc?.NextBus) return svc;

              const now = Date.now();
              const calcMins = (isoTime?: string) => {
                if (!isoTime) return undefined;
                const arrivalTime = new Date(isoTime).getTime();
                const diffMins = Math.max(0, Math.round((arrivalTime - now) / 60000));
                return diffMins;
              };

              const next1Mins = calcMins(apiSvc.NextBus.EstimatedArrival) ?? svc.nextBus.durationMins;
              const next2Mins = calcMins(apiSvc.NextBus2?.EstimatedArrival) ?? svc.nextBus2?.durationMins;
              const next3Mins = calcMins(apiSvc.NextBus3?.EstimatedArrival) ?? svc.nextBus3?.durationMins;

              return {
                ...svc,
                operator: apiSvc.Operator || svc.operator,
                nextBus: {
                  ...svc.nextBus,
                  durationMins: next1Mins,
                  load: (apiSvc.NextBus.Load || svc.nextBus.load) as BusLoad,
                  type: (apiSvc.NextBus.Type || svc.nextBus.type) as BusType,
                },
                nextBus2: svc.nextBus2 && next2Mins !== undefined
                  ? {
                      ...svc.nextBus2,
                      durationMins: next2Mins,
                      load: (apiSvc.NextBus2?.Load || svc.nextBus2.load) as BusLoad,
                      type: (apiSvc.NextBus2?.Type || svc.nextBus2.type) as BusType,
                    }
                  : undefined,
                nextBus3: svc.nextBus3 && next3Mins !== undefined
                  ? {
                      ...svc.nextBus3,
                      durationMins: next3Mins,
                      load: (apiSvc.NextBus3?.Load || svc.nextBus3.load) as BusLoad,
                      type: (apiSvc.NextBus3?.Type || svc.nextBus3.type) as BusType,
                    }
                  : undefined,
              };
            });

            return {
              ...stop,
              services: updatedServices,
            };
          });
        });
      }
    } catch (e) {
      // Graceful fallback to local simulation if network or API key is not ready
      setBusStops((current) => simulateUpdatedStops(current, REFRESH_INTERVAL_SECONDS));
    }
  }, []);

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
          fetchLiveTimings();
          return REFRESH_INTERVAL_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isAutoRefreshing, fetchLiveTimings]);

  // Initial fetch on mount
  useEffect(() => {
    fetchLiveTimings();
  }, [fetchLiveTimings]);

  const handleManualRefresh = () => {
    fetchLiveTimings();
    setRefreshSecondsLeft(REFRESH_INTERVAL_SECONDS);
  };

  // Determine stops to display:
  // In 'core-4' mode: show the 4 closest stops (< 2 min walk from SMU Lobby)
  // In 'all-8' mode: show all 8 stops in a 4x2 matrix that fits on a single screen without scrolling!
  const displayedStops =
    viewMode === 'core-4'
      ? busStops.filter((s) => ['04121', '04179', '04029', '08069'].includes(s.id))
      : busStops;

  return (
    <div className="h-screen max-h-screen w-screen max-w-screen overflow-hidden flex flex-col bg-slate-950 text-slate-100 font-sans select-none antialiased">
      
      {/* 1. Ultra-Compact High-Readability Lobby Header */}
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

      {/* 2. Slim 1-Line Status & Walk Reference Strip */}
      <div className="px-4 py-1.5 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-300 shrink-0 font-mono">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-amber-300 font-bold">
            <Footprints className="w-3.5 h-3.5 text-amber-400" />
            Origin: SMU Main Lobby (Connexion &amp; Administration)
          </span>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="text-emerald-400 hidden sm:inline flex items-center gap-1">
            <Umbrella className="w-3.5 h-3.5 text-sky-400" />
            Underground Concourse Available (Rain Sheltered)
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span className="hidden md:inline">
            Legibility: <strong>3-Meter Lobby View</strong>
          </span>
          <span className="text-slate-600 hidden md:inline">|</span>
          <span className="text-slate-300">
            {viewMode === 'all-8' ? 'All 8 Surrounding Stops' : 'Core 4 Closest Stops'}
          </span>
        </div>
      </div>

      {/* 3. ZERO-SCROLL MAIN VIEWPORT: Fits 100% on a single page */}
      <main className="flex-1 min-h-0 p-2.5 overflow-hidden">
        {viewMode === 'all-8' ? (
          // 4-Column x 2-Row Matrix: Fits all 8 bus stops on a single page without scrolling!
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
          // Core 4 Stops: 4 full-height columns with maximized 3-meter text size
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
