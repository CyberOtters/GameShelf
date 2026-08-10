/**
 * Intentional addition — inferred from the Prisma `Priority` enum (HIGH/MEDIUM/LOW) on wishlist
 * items; no wishlist UI ships upstream yet.
 * @startingPoint section="Game" subtitle="Wishlist priority dot + label" viewport="180x50"
 */
export interface PriorityPillProps {
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export function PriorityPill(props: PriorityPillProps): JSX.Element;
