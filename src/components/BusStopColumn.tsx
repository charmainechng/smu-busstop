import React, { useState } from 'react';
import { BusStop, ScaleMode, SMULobbyId } from '../types/transit';
import { BusRowItem } from './BusRowItem';
import { Footprints, ShieldCheck, ArrowUpDown, ChevronDown, ChevronUp, Navigation, Umbrella } from 'lucide-react';

interface BusStopColumnProps {
  stop: BusStop;
  selectedLobbyId: SMULobbyId;
  scaleMode: ScaleMode;
  searchFilter: string;
}

export const BusStopColumn: React.FC<BusStopColumnProps> = ({
  stop,
  selectedLobbyId,
  scaleMode,
  searchFilter,
}) => {
  const [sortByArrival, setSortByArrival] = useState<boolean>(true);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Distance and walk time from the currently selected lobby
  const distanceInfo = stop.distances[selectedLobbyId] || {
    distanceMeters: 100,
    walkTimeMinutes: 2,
    sheltered: true,
    routeTip: 'Walk via SMU pedestrian paths',
  };

  // Filter services by search text
  const filteredServices = stop.services.filter((svc) => {
    if (!searchFilter.trim()) return true;
    const term = searchFilter.toLowerCase();
    return (
      svc.serviceNo.toLowerCase().includes(term) ||
      svc.destination.toLowerCase().includes(term) ||
      stop.name.toLowerCase().includes(term) ||
      stop.road.toLowerCase().includes(term)
    );
  });

  // Sort services
  const sortedServices = [...filteredServices].sort((a, b) => {
    if (sortByArrival) {
      return a.nextBus.durationMins - b.nextBus.durationMins;
    }
    return a.serviceNo.localeCompare(b.serviceNo, undefined, { numeric: true });
  });

  // Scale classes
  const isLarge = scaleMode === 'large-3m' || scaleMode === 'hallway-5m';

  return (
    <div className="flex flex-col bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl shadow-black/40 flex-1 min-w-[340px] max-w-full transition-all">
      
      {/* Header: Bus Stop Name, Code & Road */}
      <div className="p-4 bg-gradient-to-b from-slate-800/90 to-slate-900 border-b border-slate-800">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {/* Bus Stop Code Badge */}
              <span className="px-2.5 py-0.5 rounded-md bg-amber-400 text-slate-950 font-mono font-black text-sm tracking-wide shadow-sm">
                {stop.id}
              </span>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
                {stop.road}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight font-display leading-snug">
              {stop.name}
            </h2>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label={isExpanded ? 'Collapse bus stop' : 'Expand bus stop'}
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {/* DISTANCE & ESTIMATED WALK TIME BANNER (Key Requirement!) */}
        <div className="mt-3 grid grid-cols-2 gap-2 bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5">
          
          {/* Walking Distance & Duration */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Footprints className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">From Selected Lobby</span>
              <div className="text-sm sm:text-base font-extrabold text-white font-mono flex items-baseline gap-1">
                <span className="text-amber-400">{distanceInfo.distanceMeters}m</span>
                <span className="text-slate-400 text-xs">·</span>
                <span className="text-emerald-400">{distanceInfo.walkTimeMinutes} min walk</span>
              </div>
            </div>
          </div>

          {/* Sheltered / Route Tip */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center shrink-0">
              {distanceInfo.sheltered ? (
                <Umbrella className="w-4 h-4 text-sky-400" />
              ) : (
                <Navigation className="w-4 h-4 text-amber-400" />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Weather Access</span>
              <div className="text-xs font-bold text-slate-200 truncate">
                {distanceInfo.sheltered ? (
                  <span className="text-sky-300">100% Sheltered Link</span>
                ) : (
                  <span className="text-amber-300">Surface Crossing</span>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Route guidance tip */}
        <p className="mt-2 text-[11px] text-slate-400 italic flex items-center gap-1.5 truncate">
          <span className="text-amber-400/80">Tip:</span> {distanceInfo.routeTip}
        </p>

        {/* Toolbar: Count & Sort Toggle */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span className="font-medium">
            Showing <strong className="text-white font-mono">{sortedServices.length}</strong> services
          </span>

          <button
            onClick={() => setSortByArrival(!sortByArrival)}
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors font-mono text-[11px]"
          >
            <ArrowUpDown className="w-3 h-3 text-amber-400" />
            {sortByArrival ? 'Sorted: Earliest First' : 'Sorted: Bus Number'}
          </button>
        </div>

      </div>

      {/* Bus Services Arrival Rows */}
      {isExpanded && (
        <div className="flex-1 divide-y divide-slate-800/60 overflow-y-auto max-h-[620px] scrollbar-thin scrollbar-thumb-slate-700">
          {sortedServices.length > 0 ? (
            sortedServices.map((service) => (
              <BusRowItem
                key={service.serviceNo}
                service={service}
                walkTimeMinutes={distanceInfo.walkTimeMinutes}
                scaleMode={scaleMode}
              />
            ))
          ) : (
            <div className="p-8 text-center text-slate-500 font-sans text-sm">
              No bus services match &quot;{searchFilter}&quot; at this stop.
            </div>
          )}
        </div>
      )}

      {/* Column Footer: Walk summary */}
      <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <span>Bus Stop #{stop.id}</span>
        <span className="text-emerald-400/90 font-semibold">{distanceInfo.walkTimeMinutes}m walk from lobby</span>
      </div>

    </div>
  );
};
