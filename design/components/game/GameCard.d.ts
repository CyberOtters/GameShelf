/**
 * Intentional addition — composes the established Card + StatusPill language into a backlog
 * item tile, since `games` has a schema (title/platform/status/rating/cover_url) but no
 * backlog list UI ships upstream yet.
 * @startingPoint section="Game" subtitle="Backlog item tile (cover, title, platform, status, rating)" viewport="280x260"
 */
export interface GameCardProps {
  title: string;
  platform: string;
  status: 'BACKLOG' | 'PLAYING' | 'COMPLETED' | 'DROPPED';
  rating?: number;
  coverUrl?: string;
}

export function GameCard(props: GameCardProps): JSX.Element;
