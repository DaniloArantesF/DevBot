import classes from '@styles/Button.module.css';
import { useMemo, useRef } from 'react';

type ButtonProps = React.HTMLAttributes<HTMLButtonElement> & {
  label: string;
  onClick?: () => void;
  type?: 'button' | 'link';
};

export default function Button(props: ButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const label = useMemo(() => props.label, [props.label]);
  const onClick = useMemo(() => props.onClick, [props.onClick]);
  const type = useMemo(() => props.type || 'button', [props.type]);

  return (
    <div className={classes.container}>
      <button
        ref={buttonRef}
        className={type === 'button' ? classes.button : classes.link}
        onClick={onClick}
      >
        <span>{label}</span>
      </button>
    </div>
  );
}
