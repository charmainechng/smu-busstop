// Official Destination Mappings for Singapore Bus Services around SMU
const SERVICE_DESTINATIONS: Record<string, Record<string, string>> = {
  // Keyed by stop code, then service number
  '04121': { // SMU / Stamford Rd (heading West / North-West)
    '190': 'Choa Chu Kang Int (via Stevens)',
    '7': 'Clementi Int (via Orchard)',
    '14': 'Clementi Int (via Buona Vista)',
    '16': 'Bukit Merah Int (via River Valley)',
    '36': 'Tomlinson Rd (via Orchard)',
    '124': 'Saint Michael\'s Ter (via Newton)',
    '147': 'Clementi Int (via Chinatown)',
    '166': 'Clementi Int (via Alexandra)',
    '174': 'Boon Lay Int (via Farrer Rd)',
    '175': 'Clementi Int (via Alexandra)',
  },
  '04179': { // SMU / Bras Basah Stn Exit A (heading East / North-East)
    '7': 'Bedok Temp Int (via Geylang)',
    '14': 'Bedok Temp Int (via East Coast)',
    '16': 'Bedok Int (via Marine Parade)',
    '36': 'Changi Airport PTB 2',
    '77': 'Marina Ctr Ter',
    '106': 'Shenton Way Ter (via Suntec)',
    '111': 'Ghim Moh Ter (via Orchard)',
    '131': 'Bukit Merah Int',
    '147': 'Hougang Central Int',
    '167': 'Bukit Merah Int',
    '174': 'New Bridge Rd Ter',
    '175': 'Geylang Lor 1 Ter',
    '857': 'Yishun Int (via Little India)',
  },
  '04029': { // SMU / Opp Bencoolen Stn (heading North / East)
    '64': 'Sims Place Ter',
    '65': 'Tampines Int (via Bedok Reservoir)',
    '131': 'Saint Michael\'s Ter (via Novena)',
    '139': 'Toa Payoh Int (via Boon Keng)',
    '147': 'Hougang Central Int',
    '166': 'Ang Mo Kio Int (via Thomson)',
    '857': 'Yishun Int (via CTE)',
  },
  '08069': { // Opp SMU / Hotel Rendezvous (heading West)
    '7': 'Clementi Int (via Orchard)',
    '14': 'Clementi Int (via Somerset)',
    '16': 'Bukit Merah Int',
    '36': 'Tomlinson Rd (via Dhoby Ghaut)',
    '77': 'Bukit Batok Int (via Sixth Ave)',
    '106': 'Bukit Batok Int (via Holland Village)',
    '111': 'Ghim Moh Ter',
    '131': 'Saint Michael\'s Ter',
    '147': 'Clementi Int',
    '166': 'Clementi Int',
    '174': 'Boon Lay Int',
    '175': 'Clementi Int',
  },
  '07509': { // Opp SMU / NTUC Income (heading South / West)
    '64': 'Mei Ling St (via Havelock)',
    '65': 'HarbourFront Int',
    '139': 'Bukit Merah Int',
    '640': 'Marina Blvd (Shenton Way)',
  },
  '04149': { // Armenian Ch / Opp SMU Law (heading South / West)
    '2': 'Kampong Bahru Ter',
    '12': 'Kampong Bahru Ter',
    '32': 'Buona Vista Ter',
    '33': 'Bedok Int',
    '51': 'Jurong East Int (via Pasir Panjang)',
    '61': 'Bukit Batok Int',
    '63': 'Eunos Int',
    '80': 'HarbourFront Int',
    '197': 'Jurong East Int',
  },
  '04111': { // Capitol Bldg / City Hall Stn
    '124': 'Telok Blangah Rise',
    '166': 'Clementi Int',
    '174': 'Boon Lay Int',
    '190': 'Choa Chu Kang Int',
  },
  '01012': { // Hotel Grand Pacific / Opp SMU (heading East / North)
    '2': 'Changi Village Ter',
    '12': 'Pasir Ris Int',
    '33': 'Bedok Int',
    '130': 'Ang Mo Kio Int',
    '133': 'Ang Mo Kio Int',
    '960': 'Woodlands Int (via BKE)',
  },
};

// General fallback destinations by service number
const GENERAL_DESTINATIONS: Record<string, string> = {
  '2': 'Changi Village / Kampong Bahru',
  '7': 'Bedok / Clementi',
  '12': 'Pasir Ris / Kampong Bahru',
  '14': 'Bedok / Clementi',
  '16': 'Bedok / Bukit Merah',
  '32': 'Bedok / Buona Vista',
  '33': 'Bedok / Kent Ridge',
  '36': 'Changi Airport PTB',
  '51': 'Hougang / Jurong East',
  '61': 'Eunos / Bukit Batok',
  '63': 'Eunos / Rumah Tinggi',
  '64': 'Sims Place / Mei Ling St',
  '65': 'Tampines / HarbourFront',
  '77': 'Marina Ctr / Bukit Batok',
  '80': 'Sengkang / HarbourFront',
  '106': 'Shenton Way / Bukit Batok',
  '111': 'Ghim Moh Ter',
  '124': 'Saint Michael\'s / Telok Blangah',
  '130': 'Ang Mo Kio Int',
  '131': 'Bukit Merah / Saint Michael\'s',
  '133': 'Ang Mo Kio Int',
  '139': 'Toa Payoh / Bukit Merah',
  '147': 'Hougang / Clementi',
  '166': 'Ang Mo Kio / Clementi',
  '174': 'New Bridge Rd / Boon Lay',
  '175': 'Geylang Lor 1 / Clementi',
  '190': 'Choa Chu Kang Int',
  '197': 'Bedok / Jurong East',
  '857': 'Yishun Int',
  '960': 'Woodlands Int',
};

export function getServiceDestination(serviceNo: string, stopCode?: string, destinationCode?: string): string {
  if (stopCode && SERVICE_DESTINATIONS[stopCode]?.[serviceNo]) {
    return SERVICE_DESTINATIONS[stopCode][serviceNo];
  }
  if (GENERAL_DESTINATIONS[serviceNo]) {
    return GENERAL_DESTINATIONS[serviceNo];
  }
  if (destinationCode) {
    return `To Berth ${destinationCode}`;
  }
  return `Service ${serviceNo}`;
}
