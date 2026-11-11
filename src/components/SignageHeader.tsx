import React from 'react';
import { RefreshCw, Clock, Compass, Radio } from 'lucide-react';

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
    <header className="border-b border-slate-800 bg-slate-950/95 backdrop-blur-md px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4 shrink-0 z-20">
      
      {/* Zone 1: Single Brand / Lobby Anchor */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center font-black text-slate-950 font-mono text-base shadow-sm shrink-0">
          SMU
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-sm sm:text-base lg:text-lg font-black tracking-tight text-white font-display uppercase whitespace-nowrap">
              SMU Transit
            </span>
            <span className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-amber-400/20 text-amber-300 border border-amber-400/40">
              Main Lobby
            </span>
          </div>
          <span className="text-[10px] sm:text-[11px] text-slate-400 font-sans leading-none hidden xs:inline truncate max-w-[170px] sm:max-w-none">
            Connexion &amp; Admin Hub
          </span>
        </div>
      </div>

      {/* Zone 2: Live Clock + LTA Status */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        
        {/* SGT Digital Clock */}
        <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg">
          <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-sm sm:text-base lg:text-lg font-black font-mono text-white tracking-wider tabular-nums leading-none">
            {timeString}
          </span>
          <span className="text-[10px] text-slate-400 font-mono uppercase hidden lg:inline">
            {dateString}
          </span>
        </div>

        {/* LTA DataMall Status (Desktop) */}
        <div
          className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono font-bold ${
            isLtaConfigured
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
          }`}
          title={
            isLtaConfigured
              ? 'Connected to live LTA DataMall v3 BusArrival API'
              : 'Live sync active with fallback catalog'
          }
        >
          <Radio className="w-3 h-3 text-emerald-400 animate-pulse-subtle" />
          <span>
            {isLtaConfigured ? 'LTA Live' : 'LTA Sync Active'}
          </span>
        </div>

      </div>

      {/* Zone 3: Refresh Countdown & Action Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        
        {/* Refresh widget (Desktop) */}
        <div className="hidden sm:flex items-center gap-2 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg text-xs font-mono">
          <button
            onClick={onManualRefresh}
            className="text-amber-400 hover:text-amber-300 transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center -m-1"
            title="Refresh now"
            aria-label="Refresh timings now"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshSecondsLeft === 0 ? 'animate-spin' : ''}`} />
          </button>
          <span className="text-slate-300 tabular-nums">
            {isAutoRefreshing ? (
              <>Auto <strong className="text-amber-400">{refreshSecondsLeft}s</strong></>
            ) : (
              <span className="text-rose-400">Paused</span>
            )}
          </span>
        </div>

        {/* View Switcher: All 8 vs Core 4 */}
        <div className="flex items-center p-0.5 bg-slate-900 border border-slate-800 rounded-lg">
          <button
            onClick={() => onChangeViewMode('all-8')}
            className={`px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-bold rounded transition-colors whitespace-nowrap min-h-[36px] flex items-center ${
              viewMode === 'all-8'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="View all operating bus stops"
          >
            All Stops
          </button>
          <button
            onClick={() => onChangeViewMode('core-4')}
            className={`px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-bold rounded transition-colors whitespace-nowrap min-h-[36px] flex items-center ${
              viewMode === 'core-4'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Focus on closest 4 stops"
          >
            Core 4
          </button>
        </div>

        {/* Manual Refresh Icon (Mobile touch-friendly 44px) */}
        <button
          onClick={onManualRefresh}
          className="sm:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-400 transition-colors"
          title="Refresh timings immediately"
          aria-label="Refresh now"
        >
          <RefreshCw className={`w-4 h-4 ${refreshSecondsLeft === 0 ? 'animate-spin' : ''}`} />
        </button>

        {/* Map Button (Touch-friendly 44px) */}
        <button
          onClick={onOpenMap}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-400 hover:text-amber-300 transition-colors"
          title="Open SMU Concourse & Bus Stop Map"
          aria-label="Campus map"
        >
          <Compass className="w-4 h-4" />
        </button>

      </div>

    </header>
  );
};
