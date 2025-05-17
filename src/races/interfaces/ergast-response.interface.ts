export interface ErgastCircuit {
  circuitId: string;
  circuitName: string;
  url: string;
  Location: {
    lat: string;
    long: string;
    locality: string;
    country: string;
  };
}

export interface ErgastRace {
  season: string;
  round: string;
  url: string;
  raceName: string;
  Circuit: ErgastCircuit;
  date: string;
  time: string;
}

export interface ErgastRaceTable {
  season?: string;
  Races: ErgastRace[];
}

export interface ErgastResponse {
  MRData: {
    xmlns: string;
    series: string;
    url: string;
    limit: string;
    offset: string;
    total: string;
    RaceTable: ErgastRaceTable;
  };
}
