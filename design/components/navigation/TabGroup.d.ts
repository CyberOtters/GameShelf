/**
 * @startingPoint section="Navigation" subtitle="Two-up tab switcher from the auth screen" viewport="460x80"
 */
export interface TabGroupProps {
  tabs: { value: string; label: string }[];
  active: string;
  onChange: (value: string) => void;
}

export function TabGroup(props: TabGroupProps): JSX.Element;
