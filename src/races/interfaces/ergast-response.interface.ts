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

export interface ErgastDriver {
  driverId: string;
  code: string;
  url: string;
  givenName: string;
  familyName: string;
  dateOfBirth: string;
  nationality: string;
}

export interface ErgastConstructor {
  constructorId: string;
  url: string;
  name: string;
  nationality: string;
}

export interface ErgastResult {
  Driver: ErgastDriver;
  Constructor: ErgastConstructor;
  Time?: {
    millis: string;
    time: string;
  };
  laps: string;
  grid: string;
  points: string;
  status: string;
}

export interface ErgastRace {
  season: string;
  round: string;
  url: string;
  raceName: string;
  Circuit: ErgastCircuit;
  date: string;
  time: string;
  Results?: ErgastResult[];
}

export interface ErgastRaceTable {
  season: string;
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
