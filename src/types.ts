export type FixtureStatus = 'scheduled' | 'live' | 'final';

export type Fixture = {
  id: string;
  competition: string;
  matchday: string;
  dateLabel: string;
  time: string;
  home: string;
  away: string;
  homeScore?: number;
  awayScore?: number;
  status: FixtureStatus;
  minute?: number;
  venue: string;
  isDemo?: boolean;
};

export type Standing = {
  rank: number;
  club: string;
  played: number;
  points: number;
  form: Array<'W' | 'D' | 'L'>;
};

export type Player = {
  id: string;
  number: number;
  name: string;
  role: 'Portiere' | 'Difensore' | 'Centrocampista' | 'Attaccante';
  appearances: number;
  goals: number;
  age?: number;
  marketValue?: string;
  source: 'Editoriale' | 'Transfermarkt';
};

export type NewsArticle = {
  id: string;
  category: string;
  title: string;
  summary: string;
  publishedAt: string;
  source: string;
  featured?: boolean;
};

export type AppContent = {
  fixtures: Fixture[];
  standings: Standing[];
  players: Player[];
  news: NewsArticle[];
  updatedAt: string;
};
