/**
 * @startingPoint section="Feedback" subtitle="Inline error/success message strip from auth forms" viewport="380x80"
 */
export interface MessageBannerProps {
  /** Omit (undefined) to render nothing. */
  tone?: 'error' | 'ok';
  children: React.ReactNode;
}

export function MessageBanner(props: MessageBannerProps): JSX.Element | null;
