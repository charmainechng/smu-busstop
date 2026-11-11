import React from 'react';
import { RefreshCw, Clock, Compass, Wifi, Radio } from 'lucide-react';

interface SignageHeaderProps {
  currentTime: Date;
  refreshSecondsLeft: number;
  isAutoRefreshing: boolean;
  onManualRefresh: () => void;
  onToggleAutoRefresh: () => void;
  onOpenMap: () => void;
  ltaSource: string;
  isLtaConfigured: boolean;
  viewMode: 'all-8' | 'core-4';
  onChangeViewMode: (mode: 'all-8' | 'core-4') => void;
}

export const SignageHeader: React.FC<SignageHeaderProps> = ({
  currentTime,
  refreshSecondsLeft,
  isAutoRefreshing,
  onManualRefresh,
  onToggleAutoRefresh,
  onOpenMap,
  ltaSource,
  isLtaConfigured,
  viewMode,
  onChangeViewMode,
}) => {
  const timeString = currentTime.toLocaleTimeString('en-SG', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const dateString = currentTime.toLocaleDateString('en-SG', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <header className="border-b border-slate-800 bg-slate-950 px-4 py-2 flex items-center justify-between gap-4 shrink-0 z-20">
      
      {/* Zone 1: Single Brand / Lobby Anchor */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center font-black text-slate-950 font-mono text-base shadow-sm">
          SMU
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg font-black tracking-tight text-white font-display uppercase">
              SMU MAIN LOBBY TRANSIT
            </span>
            <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-amber-400/20 text-amber-300 border border-amber-400/40">
              3M SIGNAGE
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-sans leading-none">
            Connexion &amp; Admin Hub · Distances from Main Lobby
          </span>
        </div>
      </div>

      {/* Zone 2: Live Clock + LTA DataMall Connection Status */}
      <div className="flex items-center gap-4 shrink-0">
        
        {/* SGT Digital Clock */}
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-base sm:text-lg font-black font-mono text-white tracking-wider tabular-nums leading-none">
            {timeString}
          </span>
          <span className="text-[10px] text-slate-400 font-mono uppercase hidden sm:inline">
            {dateString}
          </span>
        </div>

        {/* LTA DataMall v3 Live / Serverless Badge */}
        <div
          className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono font-bold ${
            isLtaConfigured
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
          }`}
          title={
            isLtaConfigured
              ? 'Connected to live LTA DataMall v3 BusArrival API'
              : 'Serverless /api/bustimings ready. Configure LTA_DATAMALL_API_KEY for live feed.'
          }
        >
          <Radio className="w-3 h-3 text-emerald-400 animate-pulse-subtle" />
          <span>
            {isLtaConfigured ? 'LTA DataMall Live' : 'LTA Live Sync (Key Pending)'}
          </span>
        </div>

      </div>

      {/* Zone 3: Refresh Countdown & Mode Switches */}
      <div className="flex items-center gap-2 shrink-0">
        
        {/* Refresh widget */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg text-xs font-mono">
          <button
            onClick={onManualRefresh}
            className="text-amber-400 hover:text-amber-300 transition-colors"
            title="Refresh now"
            aria-label="Refresh timings now"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshSecondsLeft === 0 ? 'animate-spin' : ''}`} />
          </button>
          <span className="text-slate-300 tabular-nums">
            {isAutoRefreshing ? (
              <>Auto-sync <strong className="text-amber-400">{refreshSecondsLeft}s</strong></>
            ) : (
              <span className="text-rose-400">Paused</span>
            )}
          </span>
        </div>

        {/* View Switcher: All 8 Stops vs Core 4 Closest */}
        <div className="flex items-center p-0.5 bg-slate-900 border border-slate-800 rounded-lg">
          <button
            onClick={() => onChangeViewMode('all-8')}
            className={`px-2.5 py-1 text-xs font-bold rounded transition-colors whitespace-nowrap ${
              viewMode === 'all-8'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Fit all 8 SMU bus stops on a single screen without scrolling"
          >
            All 8 Stops
          </button>
          <button
            onClick={() => onChangeViewMode('core-4')}
            className={`px-2.5 py-1 text-xs font-bold rounded transition-colors whitespace-nowrap ${
              viewMode === 'core-4'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Focus on the 4 closest stops right outside SMU lobby with maximum 3-meter text size"
          >
            Core 4 Stops (3M Max)
          </button>
        </div>

        {/* Map Button */}
        <button
          onClick={onOpenMap}
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-400 hover:text-amber-300 transition-colors"
          title="Open SMU Concourse & Bus Stop Map"
          aria-label="Campus map"
        >
          <Compass className="w-4 h-4" />
        </button>

      </div>

    </header>
  );
};
