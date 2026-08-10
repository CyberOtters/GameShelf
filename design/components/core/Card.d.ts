import { ReactNode, CSSProperties } from 'react';

/**
 * @startingPoint section="Core" subtitle="Cartridge card shell — the app's one card motif" viewport="460x420"
 */
export interface CardProps {
  children: ReactNode;
  /** Show the cartridge-top ridge decoration (teal bar with notches). */
  ridges?: boolean;
  style?: CSSProperties;
}

export function Card(props: CardProps): JSX.Element;
export function CardTitleBar(props: { children: ReactNode }): JSX.Element;
export function CardBody(props: { children: ReactNode; style?: CSSProperties }): JSX.Element;
