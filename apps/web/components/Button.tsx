'use client';
import classes from '@styles/Button.module.css';
import { useMemo, useRef } from 'react';

export type ButtonProps = React.HTMLAttributes<HTMLButtonElement | HTMLAnchorElement> & {
  label: string;
  onClick?: () => void;
  href?: string;
  type?: 'button' | 'link';
};

function Button(props: ButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const label = useMemo(() => props.label, [props.label]);
  const onClick = useMemo(() => props.onClick, [props.onClick]);
  const href = useMemo(() => props.href, [props.href]);
  const type = useMemo(() => props.type || 'button', [props.type]);

  return onClick ? (
    <div className={classes.container}>
      <button
        ref={buttonRef}
        className={type === 'button' ? classes.button : classes.link}
        onClick={onClick}
        style={props.style}
      >
        <span>{label}</span>
      </button>
    </div>
  ) : (
    <div className={classes.container}>
      <a
        className={type === 'button' ? classes.button : classes.link}
        href={href}
        style={props.style}
      >
        <span>{label}</span>
      </a>
    </div>
  );
}

export default Button;
