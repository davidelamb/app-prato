export function displayPlayerName(value: string) {
  const normalized = value.trim().replace(/\s+/g, ' ');
  if (!normalized) return '';

  const commaParts = normalized.split(',').map((part) => part.trim()).filter(Boolean);
  if (commaParts.length > 1) return `${commaParts[0]} ${commaParts.slice(1).join(' ')}`;

  const parts = normalized.split(' ');
  if (parts.length === 1) return normalized;

  return `${parts.at(-1)} ${parts.slice(0, -1).join(' ')}`;
}
