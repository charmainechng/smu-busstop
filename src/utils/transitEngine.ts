import { BusArrivalInfo, BusLoad, BusStop, BusType } from '../types/transit';

export type CatchabilityStatus = 'MISSED' | 'HURRY' | 'COMFORTABLE' | 'FOLLOWING_BEST';

export interface CatchabilityResult {
  status: CatchabilityStatus;
  label: string;
  badgeClass: string;
  detail: string;
}

export function evaluateCatchability(busArrivalMins: number, walkTimeMins: number, nextBus2Mins?: number): CatchabilityResult {
  if (busArrivalMins === 0) {
    if (nextBus2Mins !== undefined && nextBus2Mins >= walkTimeMins) {
      return {
        status: 'FOLLOWING_BEST',
        label: `Next in ${nextBus2Mins}m`,
        badgeClass: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
        detail: `Current bus arriving now. 2nd bus in ${nextBus2Mins} min is optimal.`,
      };
    }
    return {
      status: 'MISSED',
      label: 'At Stop',
      badgeClass: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
      detail: 'Bus is at the boarding berth now.',
    };
  }

  const delta = busArrivalMins - walkTimeMins;

  if (delta < 0) {
    // Arrival is before you can walk there
    if (nextBus2Mins !== undefined && nextBus2Mins >= walkTimeMins) {
      return {
        status: 'FOLLOWING_BEST',
        label: `Aim for 2nd (${nextBus2Mins}m)`,
        badgeClass: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
        detail: `1st bus will leave before you arrive. Target 2nd bus in ${nextBus2Mins}m.`,
      };
    }
    return {
      status: 'MISSED',
      label: 'Departing Soon',
      badgeClass: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
      detail: `Takes ${walkTimeMins}m walk, arrives in ${busArrivalMins}m.`,
    };
  }

  if (delta <= 2) {
    return {
      status: 'HURRY',
      label: 'Leave Now 🏃',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      detail: `Arrives in ${busArrivalMins}m · Walk takes ${walkTimeMins}m. Step briskly!`,
    };
  }

  return {
    status: 'COMFORTABLE',
    label: 'Good Walk 🚶',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    detail: `Arrives in ${busArrivalMins}m · Walk takes ${walkTimeMins}m. Relaxed walk.`,
  };
}

export function getLoadMeta(load: BusLoad) {
  switch (load) {
    case 'SEA':
      return {
        label: 'Seats Avail',
        code: 'SEA',
        bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        dot: 'bg-emerald-400',
        fullLabel: 'Seats Available',
      };
    case 'SDA':
      return {
        label: 'Standing',
        code: 'SDA',
        bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        dot: 'bg-amber-400',
        fullLabel: 'Standing Available',
      };
    case 'LSD':
      return {
        label: 'Crowded',
        code: 'LSD',
        bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        dot: 'bg-rose-400',
        fullLabel: 'Limited Standing',
      };
  }
}

export function formatArrivalMins(mins: number): { text: string; isArr: boolean } {
  if (mins <= 0) {
    return { text: 'Arr', isArr: true };
  }
  return { text: `${mins}m`, isArr: false };
}

// Generate realistic next arrival when a bus rolls over
export function simulateUpdatedStops(prevStops: BusStop[], elapsedSeconds: number): BusStop[] {
  // If at least 15-20 seconds have elapsed, slightly adjust or tick down
  const minuteTick = elapsedSeconds >= 30;

  return prevStops.map((stop) => {
    const updatedServices: BusArrivalInfo[] = stop.services.map((svc) => {
      let next1 = { ...svc.nextBus };
      let next2 = svc.nextBus2 ? { ...svc.nextBus2 } : undefined;
      let next3 = svc.nextBus3 ? { ...svc.nextBus3 } : undefined;

      if (minuteTick) {
        // 40% chance to decrement duration by 1 min, or if it hit 0, roll over
        const shouldDec = Math.random() > 0.4;
        if (shouldDec) {
          if (next1.durationMins > 0) {
            next1.durationMins -= 1;
          } else {
            // Bus has departed, nextBus2 moves to nextBus
            if (next2) {
              next1 = {
                ...next2,
                durationMins: Math.max(0, next2.durationMins - 1),
              };
              if (next3) {
                next2 = {
                  ...next3,
                  durationMins: Math.max(1, next3.durationMins - 1),
                };
                next3 = {
                  durationMins: next2.durationMins + Math.floor(Math.random() * 8) + 8,
                  load: (Math.random() > 0.6 ? 'SDA' : 'SEA') as BusLoad,
                  feature: 'WAB',
                  type: (Math.random() > 0.5 ? 'DD' : 'SD') as BusType,
                  estimatedTime: '',
                };
              } else {
                next2 = {
                  durationMins: next1.durationMins + Math.floor(Math.random() * 7) + 7,
                  load: 'SEA',
                  feature: 'WAB',
                  type: 'DD',
                  estimatedTime: '',
                };
              }
            } else {
              next1.durationMins = Math.floor(Math.random() * 6) + 5;
            }
          }
        }
      }

      return {
        ...svc,
        nextBus: next1,
        nextBus2: next2,
        nextBus3: next3,
      };
    });

    return {
      ...stop,
      services: updatedServices,
    };
  });
}
