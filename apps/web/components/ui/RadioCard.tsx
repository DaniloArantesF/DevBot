import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import React, { forwardRef } from 'react';
import classes from '@styles/RadioCard.module.css';

type RadioCardProps = React.ComponentProps<typeof RadioGroupPrimitive.Root> & {
  title?: string;
  children?: React.ReactNode[];
};

interface RadioItemProps {
  id: string;
  label: string;
  value: string;
}

export function RadioItem({ id, label, value, ...props }: RadioItemProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <RadioGroupPrimitive.Item id={id} className={classes.item} value={value} {...props}>
        <RadioGroupPrimitive.Indicator className={classes.indicator} />
      </RadioGroupPrimitive.Item>
      <label htmlFor={id} className={classes.label}>
        {label}
      </label>
    </div>
  );
}

const RadioCard = forwardRef<HTMLDivElement, RadioCardProps>(
  ({ title, children }, forwardedRef) => {
    return (
      <form className={classes.container}>
        {title && <label>{title}</label>}
        <RadioGroupPrimitive.Root ref={forwardedRef} className={classes.root}>
          {children}
        </RadioGroupPrimitive.Root>
      </form>
    );
  },
);

RadioCard.displayName = 'RadioCard';
export default RadioCard;
