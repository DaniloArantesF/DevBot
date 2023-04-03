import classes from '@styles/Button.module.css';
import React, { useMemo, useRef, useState } from 'react';
import clsx from 'clsx';

export type ButtonProps = React.HTMLAttributes<HTMLButtonElement | HTMLAnchorElement> & {
  label?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => Promise<void> | void;
  href?: string;
  type?: 'button' | 'link';
  variant?: 'default' | 'slim';
  justify?: 'left' | 'center' | 'right';
  children?: React.ReactNode;
};

const Button = React.forwardRef(({ children, ...props }: ButtonProps, ref) => {
  const label = useMemo(() => props.label, [props.label]);
  const onClick = useMemo(() => props.onClick, [props.onClick]);
  const href = useMemo(() => props.href, [props.href]);
  const type = useMemo(() => props.type || 'button', [props.type]);
  const variant = useMemo(() => props.variant || 'default', [props.variant]);
  const justify = useMemo(() => props.justify || 'center', [props.justify]);
  const buttonContent = useMemo(
    () => (children ? <>{children}</> : <span>{label}</span>),
    [children, label],
  );
  const [isLoading, setLoading] = useState(false);

  async function withLoading(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    if (isLoading || !onClick) return;
    setLoading(true);
    await onClick(e);
    setLoading(false);
  }

  return !href ? (
    <div className={clsx(classes.container, props.className)}>
      <button
        className={clsx(
          type === 'button' ? classes.button : classes.link,
          variant === 'slim' && classes.slim,
          justify === 'left' && classes.justifiedLeft,
          justify === 'right' && classes.justifiedRight,
        )}
        onClick={withLoading || undefined}
        style={props.style}
      >
        {isLoading ? 'Loading...' : buttonContent}
      </button>
    </div>
  ) : (
    <div className={clsx(classes.container, props.className)}>
      <a
        className={type === 'button' ? classes.button : classes.link}
        href={href}
        style={props.style}
      >
        {buttonContent}
      </a>
    </div>
  );
});

export default Button;
Button.displayName = 'Button';
