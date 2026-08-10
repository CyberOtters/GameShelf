/**
 * @startingPoint section="Forms" subtitle="Labeled text input with the teal focus lift" viewport="360x110"
 */
export interface TextFieldProps {
  label: string;
  type?: 'text' | 'email' | 'password' | 'number';
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  id?: string;
}

export function TextField(props: TextFieldProps): JSX.Element;
