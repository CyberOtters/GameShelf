/**
 * @startingPoint section="Core" subtitle="Avatar + name badge from the home player card" viewport="380x100"
 */
export interface PlayerBadgeProps {
  name: string;
  /** Small uppercase label above the name, e.g. "Now playing". */
  eyebrow?: string;
}

export function PlayerBadge(props: PlayerBadgeProps): JSX.Element;
