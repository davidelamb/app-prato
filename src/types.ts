export type FixtureStatus = 'scheduled' | 'live' | 'final';
export type LivePhase = 'scheduled' | 'first_half' | 'halftime' | 'second_half' | 'finished';
export type LiveEventType = 'kickoff' | 'halftime' | 'second_half' | 'goal' | 'fulltime';
export type PlayerRole = 'Portiere' | 'Difensore' | 'Centrocampista' | 'Attaccante';
export type MediaKind = 'Highlights' | 'Intervista' | 'Video' | 'Podcast';
export type MatchCompetition = 'Campionato' | 'Coppa Italia' | 'Amichevole';
export type StandingScope = 'overall' | 'home' | 'away' | 'form';

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
  kickoffAt?: string;
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

export type SeasonMatch = {
  id: string;
  matchday?: number;
  leg?: 'Andata' | 'Ritorno';
  competition?: MatchCompetition;
  roundLabel?: string;
  home: string;
  away: string;
  dateLabel: string;
  time: string;
  venue?: string;
  homeScore?: number;
  awayScore?: number;
  sortOrder?: number;
};

export type Standing = {
  rank: number;
  club: string;
  played: number;
  wins?: number;
  draws?: number;
  losses?: number;
  goalsFor?: number;
  goalsAgainst?: number;
  goalDifference?: number;
  points: number;
  form?: Array<'W' | 'D' | 'L'>;
};

export type Player = {
  id: string;
  number?: number;
  name: string;
  role: PlayerRole;
  appearances: number;
  starts?: number;
  minutes?: number;
  goals: number;
  assists?: number;
  yellowCards?: number;
  redCards?: number;
  age?: number;
  birthDate?: string;
  birthplace?: string;
  nationality?: string;
  height?: string;
  foot?: string;
  contractUntil?: string;
  marketValue?: string;
  bio?: string;
  source: 'Editoriale' | 'Transfermarkt';
  imageUrl?: string;
  imageSourceUrl?: string;
  imageScale?: number;
  imagePositionX?: number;
  imagePositionY?: number;
};

export type NewsArticle = {
  id: string;
  category: string;
  title: string;
  summary: string;
  body?: string;
  publishedAt: string;
  source: string;
  sourceUrl?: string;
  featured?: boolean;
  imageUrl?: string;
};

export type MediaItem = {
  id: string;
  kind: MediaKind;
  title: string;
  description: string;
  publishedAt: string;
  source: string;
  thumbnailUrl: string;
  url: string;
  featured?: boolean;
};

export type AppContent = {
  fixtures: Fixture[];
  standings: Standing[];
  homeStandings?: Standing[];
  awayStandings?: Standing[];
  formStandings?: Standing[];
  schedule?: SeasonMatch[];
  players: Player[];
  news: NewsArticle[];
  media: MediaItem[];
  updatedAt: string;
};
