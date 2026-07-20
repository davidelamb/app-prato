export type FixtureStatus = 'scheduled' | 'live' | 'final';
export type LivePhase = 'scheduled' | 'first_half' | 'halftime' | 'second_half' | 'finished';
export type LiveEventType = 'kickoff' | 'halftime' | 'second_half' | 'goal' | 'fulltime';

export type LiveEvent = {
  id: string;
  type: LiveEventType;
  label: string;
  minute?: number;
  team?: string;
  scorer?: string;
  score?: string;
  createdAt: string;
};

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
  livePhase?: LivePhase;
  liveEvents?: LiveEvent[];
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
  imageUrl?: string;
};

export type NewsArticle = {
  id: string;
  category: string;
  title: string;
  summary: string;
  body?: string;
  publishedAt: string;
  source: string;
  featured?: boolean;
  imageUrl?: string;
};

export type AppContent = {
  fixtures: Fixture[];
  standings: Standing[];
  players: Player[];
  news: NewsArticle[];
  updatedAt: string;
};
