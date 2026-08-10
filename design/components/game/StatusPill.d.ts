/**
 * Intentional addition — GameShelf's schema defines `GameStatus` (BACKLOG/PLAYING/COMPLETED/DROPPED)
 * but no backlog UI ships yet upstream. Built from the enum + established shadow/border language.
 * @startingPoint section="Game" subtitle="Backlog status chip (from the GameStatus enum)" viewport="200x60"
 */
export interface StatusPillProps {
  status: 'BACKLOG' | 'PLAYING' | 'COMPLETED' | 'DROPPED';
}

export function StatusPill(props: StatusPillProps): JSX.Element;
