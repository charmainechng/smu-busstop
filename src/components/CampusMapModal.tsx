import React from 'react';
import { X, MapPin, Footprints, Umbrella, ArrowRight, ShieldCheck } from 'lucide-react';
import { BusStop, SMULobby, SMULobbyId } from '../types/transit';

interface CampusMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLobby: SMULobby;
  busStops: BusStop[];
  onSelectBusStop?: (stopId: string) => void;
}

export const CampusMapModal: React.FC<CampusMapModalProps> = ({
  isOpen,
  onClose,
  currentLobby,
  busStops,
  onSelectBusStop,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <h3 className="text-xl font-black text-white font-display">
                SMU Campus & Bus Stop Walking Schematic
              </h3>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Distances & walk times measured from: <strong className="text-amber-400 font-semibold">{currentLobby.fullName}</strong>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          
          {/* Concourse Weather Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-sky-950/60 to-slate-900 border border-sky-800/40 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center shrink-0">
              <Umbrella className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-sky-200">
                SMU Underground Concourse (All-Weather Sheltered Network)
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                SMU buildings are connected underground via the Basement 1 Concourse. You can walk between Library, Connexion, School of Law, SOSS, SOA, and SCIS in full air-conditioning without rain exposure!
              </p>
            </div>
          </div>

          {/* Schematic Diagram of SMU roads & Stops */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 relative overflow-hidden">
            <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-3">
              Spatial Campus Layout
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              
              {/* North: Bras Basah Rd */}
              <div className="md:col-span-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <span className="text-xs font-mono font-extrabold text-amber-300 uppercase tracking-widest block mb-2">
                  ▲ NORTH: BRAS BASAH ROAD
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="flex items-center justify-between text-xs font-bold text-white">
                      <span>SMU / Bras Basah Stn (04179)</span>
                      <span className="text-emerald-400 font-mono">
                        {busStops.find(s => s.id === '04179')?.distances[currentLobby.id]?.walkTimeMinutes || 1} min
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Outside Library & School of Accountancy</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="flex items-center justify-between text-xs font-bold text-white">
                      <span>Opp SMU / Rendezvous (08069)</span>
                      <span className="text-emerald-400 font-mono">
                        {busStops.find(s => s.id === '08069')?.distances[currentLobby.id]?.walkTimeMinutes || 2} min
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Across Bras Basah facing SOSS / Prinsep</p>
                  </div>
                </div>
              </div>

              {/* West: Bencoolen St */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-xs font-mono font-extrabold text-amber-300 uppercase tracking-widest block mb-2 text-center">
                  ◄ WEST: BENCOOLEN ST
                </span>
                <div className="space-y-2">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                    <div className="font-bold text-white flex justify-between">
                      <span>SMU / Opp Bencoolen (04029)</span>
                      <span className="text-emerald-400 font-mono">
                        {busStops.find(s => s.id === '04029')?.distances[currentLobby.id]?.walkTimeMinutes || 1}m
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">Outside Social Sciences & Economics</p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                    <div className="font-bold text-white flex justify-between">
                      <span>Opp SMU / NTUC (07509)</span>
                      <span className="text-amber-400 font-mono">
                        {busStops.find(s => s.id === '07509')?.distances[currentLobby.id]?.walkTimeMinutes || 2}m
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">Across Bencoolen St</p>
                  </div>
                </div>
              </div>

              {/* Center: SMU Campus Green & Buildings */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-amber-950/20 border-2 border-dashed border-amber-400/40 flex flex-col items-center justify-center text-center">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[11px] font-mono font-bold uppercase mb-2">
                  Central Campus
                </span>
                <h4 className="text-base font-black text-white font-display">
                  SMU CAMPUS GREEN
                </h4>
                <p className="text-xs text-slate-300 mt-1">
                  Active Lobby: <span className="text-amber-400 font-bold">{currentLobby.name}</span>
                </p>
                <div className="mt-3 text-[10px] font-mono text-emerald-400 bg-slate-950/80 px-2 py-1 rounded border border-emerald-500/30">
                  ✓ B1 Concourse Air-Conditioned Passageway
                </div>
              </div>

              {/* East: Victoria St */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-xs font-mono font-extrabold text-amber-300 uppercase tracking-widest block mb-2 text-center">
                  EAST: VICTORIA ST ►
                </span>
                <div className="space-y-2">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                    <div className="font-bold text-white flex justify-between">
                      <span>Hotel Grand Pacific (01012)</span>
                      <span className="text-amber-400 font-mono">
                        {busStops.find(s => s.id === '01012')?.distances[currentLobby.id]?.walkTimeMinutes || 3}m
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">Across Victoria St near SCIS</p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                    <div className="font-bold text-white flex justify-between">
                      <span>Capitol / City Hall (04111)</span>
                      <span className="text-amber-400 font-mono">
                        {busStops.find(s => s.id === '04111')?.distances[currentLobby.id]?.walkTimeMinutes || 4}m
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">South on North Bridge Rd</p>
                  </div>
                </div>
              </div>

              {/* South: Stamford Rd & Armenian St */}
              <div className="md:col-span-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <span className="text-xs font-mono font-extrabold text-amber-300 uppercase tracking-widest block mb-2">
                  ▼ SOUTH: STAMFORD ROAD & ARMENIAN STREET
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="flex items-center justify-between text-xs font-bold text-white">
                      <span>SMU / Stamford Rd (04121)</span>
                      <span className="text-emerald-400 font-mono">
                        {busStops.find(s => s.id === '04121')?.distances[currentLobby.id]?.walkTimeMinutes || 1} min
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Outside SMU Connexion & School of Law</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="flex items-center justify-between text-xs font-bold text-white">
                      <span>Armenian Ch / Opp SMU Law (04149)</span>
                      <span className="text-emerald-400 font-mono">
                        {busStops.find(s => s.id === '04149')?.distances[currentLobby.id]?.walkTimeMinutes || 1} min
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Beside Armenian Church & Law School</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Table of all 8 bus stops with exact distances */}
          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <div className="bg-slate-800/80 px-4 py-2.5 font-mono text-xs font-bold text-slate-200">
              Bus Stops Distance & Walk Time Directory (from {currentLobby.name})
            </div>
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Stop Code & Name</th>
                  <th className="py-2.5 px-3">Road</th>
                  <th className="py-2.5 px-3">Distance</th>
                  <th className="py-2.5 px-3">Walk Time</th>
                  <th className="py-2.5 px-3">Shelter</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200 font-mono">
                {busStops.map((stop) => {
                  const dist = stop.distances[currentLobby.id];
                  return (
                    <tr key={stop.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="py-2.5 px-4">
                        <span className="text-amber-400 font-bold mr-2">{stop.id}</span>
                        <span className="text-white font-sans font-medium">{stop.name}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 font-sans">{stop.road}</td>
                      <td className="py-2.5 px-3 text-amber-300 font-bold">{dist?.distanceMeters}m</td>
                      <td className="py-2.5 px-3 text-emerald-400 font-bold">{dist?.walkTimeMinutes} min</td>
                      <td className="py-2.5 px-3 font-sans">
                        {dist?.sheltered ? (
                          <span className="text-sky-300 text-[11px] flex items-center gap-1">
                            <Umbrella className="w-3 h-3" /> Sheltered
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Surface</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition-colors shadow"
          >
            Return to Live Lobby Board
          </button>
        </div>

      </div>
    </div>
  );
};
