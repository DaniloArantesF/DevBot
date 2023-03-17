import classes from '@styles/Button.module.css';
import React, { useMemo, useRef } from 'react';
import clsx from 'clsx';

export type ButtonProps = React.HTMLAttributes<HTMLButtonElement | HTMLAnchorElement> & {
  label: string;
  onClick?: () => void;
  href?: string;
  type?: 'button' | 'link';
  variant?: 'default' | 'slim';
};

const Button = React.forwardRef((props: ButtonProps, ref) => {
  const label = useMemo(() => props.label, [props.label]);
  const onClick = useMemo(() => props.onClick, [props.onClick]);
  const href = useMemo(() => props.href, [props.href]);
  const type = useMemo(() => props.type || 'button', [props.type]);
  const variant = useMemo(() => props.variant || 'default', [props.variant]);

  return onClick ? (
    <div className={classes.container}>
      <button
        className={clsx(
          type === 'button' ? classes.button : classes.link,
          variant === 'slim' && classes.slim,
        )}
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
});

export default Button;
Button.displayName = 'Button';
