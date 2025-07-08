export interface League {
  id: string;
  realm: 'pc' | 'xbox' | 'sony';
  text: string;
}

export interface LeagueData {
  result: League[];
}