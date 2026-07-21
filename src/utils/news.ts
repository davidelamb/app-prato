import { NewsArticle } from '../types';

const months: Record<string, number> = {
  GEN: 0, FEB: 1, MAR: 2, APR: 3, MAG: 4, GIU: 5,
  LUG: 6, AGO: 7, SET: 8, OTT: 9, NOV: 10, DIC: 11,
};

function newsTimestamp(value: string): number {
  const normalized = value.trim().toUpperCase().replace(/\./g, '');
  const match = normalized.match(/^(\d{1,2})\s+([A-Z]{3})\s+(\d{4})$/);
  if (match && months[match[2]] !== undefined) return Date.UTC(Number(match[3]), months[match[2]], Number(match[1]));
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function sortNewsByDate(news: NewsArticle[]): NewsArticle[] {
  return news
    .map((article, index) => ({ article, index }))
    .sort((a, b) => newsTimestamp(b.article.publishedAt) - newsTimestamp(a.article.publishedAt) || a.index - b.index)
    .map(({ article }) => article);
}
