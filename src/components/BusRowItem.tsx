import React from 'react';
import { BusArrivalInfo, ScaleMode } from '../types/transit';
import { evaluateCatchability, formatArrivalMins, getLoadMeta } from '../utils/transitEngine';
import { Accessibility, Bus } from 'lucide-react';

interface BusRowItemProps {
  service: BusArrivalInfo;
  walkTimeMinutes: number;
  scaleMode: ScaleMode;
}

export const BusRowItem: React.FC<BusRowItemProps> = ({
  service,
  walkTimeMinutes,
  scaleMode,
}) => {
  const next1 = service.nextBus;
  const next2 = service.nextBus2;
  const next3 = service.nextBus3;

  const catchability = evaluateCatchability(
    next1.durationMins,
    walkTimeMinutes,
    next2?.durationMins
  );

  const load1 = getLoadMeta(next1.load);
  const formattedNext1 = formatArrivalMins(next1.durationMins);

  // Dynamic scale classes based on 3m / 5m viewing distance
  const getScaleClasses = () => {
    switch (scaleMode) {
      case 'hallway-5m':
        return {
          rowPadding: 'py-3.5 px-4',
          serviceNumber: 'text-3xl sm:text-4xl min-w-[76px]',
          destTitle: 'text-base sm:text-lg',
          primaryArrival: 'text-3xl sm:text-4xl',
          secArrival: 'text-sm sm:text-base',
          badgeText: 'text-xs',
        };
      case 'large-3m':
        return {
          rowPadding: 'py-3 px-3.5',
          serviceNumber: 'text-2xl sm:text-3xl min-w-[68px]',
          destTitle: 'text-sm sm:text-base',
          primaryArrival: 'text-2xl sm:text-3xl',
          secArrival: 'text-xs sm:text-sm',
          badgeText: 'text-[11px]',
        };
      default:
        return {
          rowPadding: 'py-2 px-3',
          serviceNumber: 'text-xl sm:text-2xl min-w-[58px]',
          destTitle: 'text-xs sm:text-sm',
          primaryArrival: 'text-xl sm:text-2xl',
          secArrival: 'text-xs',
          badgeText: 'text-[10px]',
        };
    }
  };

  const scale = getScaleClasses();

  return (
    <div className={`flex items-center justify-between gap-3 border-b border-slate-800/80 hover:bg-slate-800/40 transition-colors ${scale.rowPadding}`}>
      
      {/* Left: Bus Number + Destination & Type */}
      <div className="flex items-center gap-3 min-w-0">
        {/* High-visibility Bus Service Number Badge */}
        <div className={`font-mono font-black text-center rounded-lg px-2 py-1 bg-amber-400 text-slate-950 shadow-md shadow-amber-400/10 tracking-tight shrink-0 ${scale.serviceNumber}`}>
          {service.serviceNo}
        </div>

        {/* Destination & Badges */}
        <div className="min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`font-bold text-slate-100 truncate font-display tracking-tight ${scale.destTitle}`}>
              {service.destination}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-0.5 text-slate-400 flex-wrap">
            {/* Bus Type */}
            <span className={`font-mono font-semibold ${scale.badgeText} text-slate-300 flex items-center gap-0.5`}>
              {next1.type === 'DD' ? (
                <span className="text-amber-300 font-bold">Double Deck</span>
              ) : (
                <span>Single Deck</span>
              )}
            </span>

            {/* Wheelchair accessible indicator */}
            {next1.feature === 'WAB' && (
              <span className={`inline-flex items-center text-slate-400 ${scale.badgeText}`} title="Wheelchair Accessible Bus">
                <Accessibility className="w-3 h-3 text-sky-400" />
              </span>
            )}

            {/* Catchability walking advisory */}
            <span className={`px-2 py-0.5 rounded font-mono font-semibold border ${catchability.badgeClass} ${scale.badgeText}`}>
              {catchability.label}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Arrival Timings (Next Bus, 2nd, 3rd) & Occupancy Load */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0 text-right">
        
        {/* Next Bus Arrival (Huge high-contrast font for 3m visibility) */}
        <div className="flex flex-col items-end">
          <div className="flex items-baseline gap-1">
            <span
              className={`font-mono font-black tracking-tight tabular-nums ${scale.primaryArrival} ${
                formattedNext1.isArr
                  ? 'text-emerald-400 animate-pulse-subtle'
                  : next1.durationMins <= walkTimeMinutes
                  ? 'text-amber-400'
                  : 'text-white'
              }`}
            >
              {formattedNext1.text}
            </span>
          </div>

          {/* Bus Occupancy Load Badge (LTA Standard) */}
          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border ${load1.bg} ${scale.badgeText} font-mono font-bold uppercase mt-0.5`}>
            <span className={`w-1.5 h-1.5 rounded-full ${load1.dot}`} />
            <span>{load1.label}</span>
          </div>
        </div>

        {/* Subsequent Bus Departures (2nd & 3rd buses) */}
        {(next2 || next3) && (
          <div className="hidden sm:flex flex-col items-end justify-center pl-2 border-l border-slate-800 text-slate-400 font-mono">
            {next2 && (
              <div className={`tabular-nums ${scale.secArrival} text-slate-300 flex items-center gap-1`}>
                <span className="text-[10px] text-slate-500 font-sans">2nd:</span>
                <span className="font-bold text-slate-200">{next2.durationMins}m</span>
              </div>
            )}
            {next3 && (
              <div className={`tabular-nums ${scale.secArrival} text-slate-400 flex items-center gap-1`}>
                <span className="text-[10px] text-slate-500 font-sans">3rd:</span>
                <span>{next3.durationMins}m</span>
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
};
