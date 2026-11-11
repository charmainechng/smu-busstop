export type BusLoad = 'SEA' | 'SDA' | 'LSD'; // Seats Available, Standing Available, Limited Standing
export type BusType = 'SD' | 'DD' | 'BD'; // Single Decker, Double Decker, Bendy
export type SMULobbyId = 'connexion' | 'library' | 'law' | 'soss' | 'soa' | 'scis';

export interface SMULobby {
  id: SMULobbyId;
  name: string;
  fullName: string;
  description: string;
  undergroundAccess: boolean;
}

export interface BusArrivalInfo {
  serviceNo: string;
  operator: 'SBST' | 'SMRT' | 'TTS' | 'GAS';
  destination: string;
  category: 'Trunk' | 'Express' | 'City Direct' | 'Feeder';
  nextBus: {
    durationMins: number; // 0 for Arr
    load: BusLoad;
    feature: 'WAB' | 'NORMAL';
    type: BusType;
    estimatedTime: string; // ISO or HH:mm
  };
  nextBus2?: {
    durationMins: number;
    load: BusLoad;
    feature: 'WAB' | 'NORMAL';
    type: BusType;
    estimatedTime: string;
  };
  nextBus3?: {
    durationMins: number;
    load: BusLoad;
    feature: 'WAB' | 'NORMAL';
    type: BusType;
    estimatedTime: string;
  };
}

export interface BusStopDistanceMatrix {
  [lobbyId: string]: {
    distanceMeters: number;
    walkTimeMinutes: number;
    sheltered: boolean;
    routeTip: string;
  };
}

export interface BusStop {
  id: string; // e.g. "04179"
  name: string; // e.g. "SMU / Bras Basah Stn Exit A"
  road: string; // e.g. "Bras Basah Rd"
  description: string;
  distances: BusStopDistanceMatrix;
  services: BusArrivalInfo[];
  lat: number;
  lng: number;
}

export type ViewMode = 'signage-3m' | 'compact-grid' | 'split-detail';
export type ScaleMode = 'standard' | 'large-3m' | 'hallway-5m';
