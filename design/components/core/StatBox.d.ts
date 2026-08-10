/**
 * @startingPoint section="Core" subtitle="Labeled stat tile (e.g. Email, Hours Played)" viewport="360x110"
 */
export interface StatBoxProps {
  label: string;
  value: string;
}

export function StatBox(props: StatBoxProps): JSX.Element;
