export interface ErgastDriver {
  driverId: string;
  permanentNumber: string;
  code: string;
  url: string;
  givenName: string;
  familyName: string;
  dateOfBirth: string;
  nationality: string;
}

export interface ErgastDriverStanding {
  Driver: ErgastDriver;
}

export interface ErgastStandingsList {
  DriverStandings: ErgastDriverStanding[];
}

export interface ErgastStandingsTable {
  StandingsLists: ErgastStandingsList[];
}

export interface ErgastSeason {
  season: number;
  url: string;
}

export interface ErgastSeasonTable {
  Seasons: ErgastSeason[];
}

export interface ErgastResponse {
  MRData: {
    xmlns: string;
    series: string;
    url: string;
    limit: string;
    offset: string;
    total: string;
    SeasonTable?: ErgastSeasonTable;
    StandingsTable?: ErgastStandingsTable;
  };
}
