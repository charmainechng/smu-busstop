import React from 'react';
import { BusStop } from '../types/transit';
import { formatArrivalMins, getLoadMeta, evaluateCatchability } from '../utils/transitEngine';
import { Footprints, Umbrella, Navigation } from 'lucide-react';

interface BusStopCardSinglePageProps {
  stop: BusStop;
  walkTimeMinutes: number;
  distanceMeters: number;
  sheltered: boolean;
  maxRows?: number;
  isMobileFocused?: boolean;
}

export const BusStopCardSinglePage: React.FC<BusStopCardSinglePageProps> = ({
  stop,
  walkTimeMinutes,
  distanceMeters,
  sheltered,
  maxRows = 4,
  isMobileFocused = false,
}) => {
  // Sort services by earliest arrival first
  const sortedServices = [...stop.services]
    .sort((a, b) => a.nextBus.durationMins - b.nextBus.durationMins)
    .slice(0, maxRows);

  return (
    <div className="flex flex-col h-auto lg:h-full bg-slate-900/95 border border-slate-800 rounded-xl overflow-hidden shadow-lg shadow-black/30 justify-between">
      
      {/* Header: Stop Code + Name + Distance/Walk (High Contrast) */}
      <div className="px-3 py-2 bg-gradient-to-r from-slate-850 to-slate-900 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
        <div className="min-w-0 flex items-center gap-2">
          {/* Stop Code Badge */}
          <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-mono font-black text-xs tracking-wider shrink-0">
            {stop.id}
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-extrabold text-white truncate font-display tracking-tight leading-tight">
              {stop.name}
            </h2>
            <span className="text-[10px] text-slate-400 uppercase font-mono block truncate">
              {stop.road}
            </span>
          </div>
        </div>

        {/* Distance & Walking Time from SMU Main Lobby */}
        <div className="flex items-center gap-1.5 shrink-0 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800">
          <Footprints className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <div className="text-right leading-none">
            <div className="text-xs font-mono font-black text-amber-300">
              {distanceMeters}m
            </div>
            <div className="text-[10px] font-mono text-emerald-400 font-bold mt-0.5">
              {walkTimeMinutes}m walk
            </div>
          </div>
          {sheltered ? (
            <span title="100% Sheltered via SMU Concourse">
              <Umbrella className="w-3.5 h-3.5 text-sky-400 shrink-0 ml-0.5" />
            </span>
          ) : (
            <span title="Surface street crossing">
              <Navigation className="w-3.5 h-3.5 text-slate-500 shrink-0 ml-0.5" />
            </span>
          )}
        </div>
      </div>

      {/* Bus Rows (Zero scroll - fits precisely into available vertical room) */}
      <div className="flex-1 min-h-0 flex flex-col justify-around divide-y divide-slate-800/60 px-2.5 py-1">
        {sortedServices.map((service) => {
          const next1 = service.nextBus;
          const next2 = service.nextBus2;
          const formatted1 = formatArrivalMins(next1.durationMins);
          const loadMeta = getLoadMeta(next1.load);
          const catchability = evaluateCatchability(next1.durationMins, walkTimeMinutes, next2?.durationMins);

          return (
            <div
              key={service.serviceNo}
              className="flex items-center justify-between py-1.5 lg:py-1 gap-2 hover:bg-slate-800/30 rounded transition-colors px-1 min-h-[46px] lg:min-h-0"
            >
              {/* Left: Bus Service Number & Destination */}
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono font-black text-xl sm:text-2xl px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 min-w-[50px] sm:min-w-[52px] text-center shrink-0 tracking-tight shadow-sm">
                  {service.serviceNo}
                </span>

                <div className="min-w-0 flex flex-col">
                  <span className="text-xs sm:text-sm font-bold text-slate-100 truncate font-display">
                    {service.destination}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-mono text-slate-400 font-semibold hidden xs:inline">
                      {next1.type === 'DD' ? 'Double Deck' : 'Single Deck'}
                    </span>
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${catchability.badgeClass}`}>
                      {catchability.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Arrival Time (Large for 3m visibility) + Crowd Load */}
              <div className="flex items-center gap-2 shrink-0 text-right">
                <div className="flex flex-col items-end">
                  <span
                    className={`font-mono font-black text-xl sm:text-2xl tabular-nums tracking-tight leading-none ${
                      formatted1.isArr
                        ? 'text-emerald-400 animate-pulse-subtle'
                        : next1.durationMins <= walkTimeMinutes
                        ? 'text-amber-400'
                        : 'text-white'
                    }`}
                  >
                    {formatted1.text}
                  </span>

                  {/* Load indicator badge */}
                  <div className={`mt-0.5 flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${loadMeta.bg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${loadMeta.dot}`} />
                    <span>{loadMeta.label}</span>
                  </div>
                </div>

                {/* 2nd Bus Timing (Visible on mobile phone & desktop wide) */}
                {next2 && (
                  <div className="flex flex-col items-end pl-1.5 border-l border-slate-800 text-[11px] font-mono text-slate-400">
                    <span className="text-[9px] text-slate-500">2nd</span>
                    <span className="font-bold text-slate-300">{next2.durationMins}m</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Card Footer: Fast status */}
      <div className="px-3 py-1 bg-slate-950/70 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono shrink-0">
        <span className="truncate">
          {sheltered ? '☂️ Undercover via Concourse' : '⛅ Surface route'}
        </span>
        <span className="text-emerald-400 font-bold shrink-0">
          {walkTimeMinutes} min from Lobby
        </span>
      </div>

    </div>
  );
};
