import React from 'react';
import { Search, X, Info } from 'lucide-react';

interface BusFilterBarProps {
  searchFilter: string;
  onSearchChange: (val: string) => void;
  selectedDestinationTag: string | null;
  onSelectDestinationTag: (tag: string | null) => void;
  activeStopsCount: number;
  totalServicesCount: number;
}

const POPULAR_DESTINATIONS = [
  { label: 'All Destinations', query: null },
  { label: 'Orchard & Somerset', query: 'Orchard' },
  { label: 'Clementi & West', query: 'Clementi' },
  { label: 'Bedok & East Coast', query: 'Bedok' },
  { label: 'Changi Airport', query: 'Airport' },
  { label: 'Choa Chu Kang (190)', query: 'Choa Chu Kang' },
  { label: 'Hougang & Serangoon', query: 'Hougang' },
  { label: 'Toa Payoh & AMK', query: 'Ang Mo Kio' },
  { label: 'Shenton Way & CBD', query: 'Shenton' },
];

export const BusFilterBar: React.FC<BusFilterBarProps> = ({
  searchFilter,
  onSearchChange,
  selectedDestinationTag,
  onSelectDestinationTag,
  activeStopsCount,
  totalServicesCount,
}) => {
  return (
    <div className="bg-slate-900/80 border-b border-slate-800/80 px-4 sm:px-6 py-2.5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        
        {/* Search Input */}
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => {
                onSearchChange(e.target.value);
                if (selectedDestinationTag) onSelectDestinationTag(null);
              }}
              placeholder="Search bus service (e.g. 190, 147, 7, 36) or destination..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-9 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition-colors font-sans"
            />
            {searchFilter && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Destination Quick Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          {POPULAR_DESTINATIONS.map((dest) => {
            const isSelected =
              (dest.query === null && !searchFilter && !selectedDestinationTag) ||
              selectedDestinationTag === dest.query;
            return (
              <button
                key={dest.label}
                onClick={() => {
                  onSelectDestinationTag(dest.query);
                  if (dest.query) {
                    onSearchChange(dest.query);
                  } else {
                    onSearchChange('');
                  }
                }}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-950/70 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                }`}
              >
                {dest.label}
              </button>
            );
          })}
        </div>

        {/* LTA Status Legend / Summary */}
        <div className="hidden 2xl:flex items-center gap-3 text-xs text-slate-400 font-mono border-l border-slate-800 pl-4">
          <span className="text-[11px] font-sans font-semibold text-slate-300">Crowd Levels:</span>
          <span className="flex items-center gap-1 text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Seats Available
          </span>
          <span className="flex items-center gap-1 text-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Standing
          </span>
          <span className="flex items-center gap-1 text-rose-300">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            Limited
          </span>
        </div>

      </div>
    </div>
  );
};
