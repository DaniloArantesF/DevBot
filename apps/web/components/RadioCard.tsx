import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import React, { forwardRef } from 'react';
import classes from '@styles/RadioCard.module.css';

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

type RadioCardProps = React.ComponentProps<typeof RadioGroupPrimitive.Root> & {
  title: string;
};

const RadioCard = forwardRef<HTMLFormElement, RadioCardProps>(({ title }, forwardedRef) => {
  const items = ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5'];

  return (
    <form className={classes.container}>
      <label>{title}</label>
      <RadioGroupPrimitive.Root className={classes.root}>
        {items.map((item, index) => (
          <RadioItem key={index} id={`item-${index}`} label={item} value={item} />
        ))}
      </RadioGroupPrimitive.Root>
    </form>
  );
});

RadioCard.displayName = 'RadioCard';
export default RadioCard;
