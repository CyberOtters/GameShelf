import { ReactNode, CSSProperties } from 'react';

/**
 * @startingPoint section="Core" subtitle="Chunky offset-shadow pressable button" viewport="700x200"
 */
export interface ButtonProps {
  children: ReactNode;
  /** Visual treatment. Primary = tomato fill, Ghost = card fill with ink text. */
  variant?: 'primary' | 'ghost';
  disabled?: boolean;
  /** Render as a link instead of a button. */
  as?: 'button' | 'a';
  href?: string;
  onClick?: () => void;
  style?: CSSProperties;
}

export function Button(props: ButtonProps): JSX.Element;
